<?php

namespace App\Services;

use App\Models\Document;
use App\Models\NotificationRead;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DocumentReminderService
{
    public const TIER_INFO     = 'info';
    public const TIER_WARNING  = 'warning';
    public const TIER_URGENT   = 'urgent';
    public const TIER_OVERDUE  = 'overdue';

    /**
     * Return the unread reminders for a user's office, sorted by severity.
     * Never returns reminders the user already dismissed today at the same
     * tier.
     *
     * @return Collection<int, array>
     */
    public function unreadFor(User $user): Collection
    {
        if (!$user->office_id || !$user->is_active) {
            return collect();
        }

        $cfg       = config('document-tracking.reminder');
        $now       = Carbon::now();
        // $minCutoff = $now->copy()->subHours((int) $cfg['min_hours']);
        $minCutoff = $now->copy()->subMinutes((int) $cfg['min_minutes']);
        $resetOnTierChange = (bool) $cfg['reset_on_tier_change'];

        /* --------------------------------------------------------------
         * Fetch candidate rows — lightweight, computed further below.
         * -------------------------------------------------------------- */
        $rows = DB::table('documents')
            ->join('document_routes as r', function ($join) use ($user) {
                $join->on('r.document_id', '=', 'documents.id')
                     ->where('r.office_id', '=', $user->office_id);
            })
            ->whereNull('r.forwarded_at')
            ->whereNotNull('r.received_at')
            ->whereNotNull('r.due_at')
            ->whereNotIn('documents.status', [
                Document::STATUS_COMPLETED,
                Document::STATUS_CANCELLED,
            ])
            ->where('r.received_at', '<=', $minCutoff)
            ->select([
                'documents.id',
                'documents.tracking_number',
                'documents.title',
                'documents.status',
                'r.sequence',
                'r.received_at',
                'r.due_at',
                'r.processing_days',
            ])
            ->get();

        if ($rows->isEmpty()) {
            return collect();
        }

        /* --------------------------------------------------------------
         * Compute tier + timing, filter out silent rows.
         * -------------------------------------------------------------- */
        $reminders = $rows
            ->map(fn ($row) => $this->buildReminder($row, $now, $cfg))
            ->filter(fn ($r) => $r !== null)
            ->values();

        if ($reminders->isEmpty()) {
            return collect();
        }

        /* --------------------------------------------------------------
         * Read-state lookup.
         * -------------------------------------------------------------- */
        $keys = $reminders->pluck('key')->all();

        $readKeys = NotificationRead::query()
            ->where('user_id', $user->id)
            ->whereIn('notification_key', $keys)
            ->pluck('notification_key')
            ->flip();

        return $reminders
            ->reject(fn ($r) => isset($readKeys[$r['key']]))
            ->sortByDesc(fn ($r) => $this->severityRank($r['tier']))
            ->values();
    }

    /**
     * Build a reminder array for a raw query row, or return null when the
     * document doesn't yet qualify.
     */
    private function buildReminder(object $row, Carbon $now, array $cfg): ?array
    {
        $received = Carbon::parse($row->received_at);
        $dueAt    = Carbon::parse($row->due_at);

        $elapsed = $received->diffInSeconds($now, false);
        $window  = $received->diffInSeconds($dueAt, false);

        if ($window <= 0) {
            // Guard against malformed data — treat as overdue.
            $window = 1;
        }

        $pct     = $elapsed / $window;
        $remaining = $now->diffInSeconds($dueAt, false);

        $tier = $this->tierFromPct($pct, $cfg);
        if ($tier === null) {
            return null; // below info threshold — still silent
        }

        return [
            'id'                => (int) $row->id,
            'tracking_number'   => $row->tracking_number,
            'title'             => $row->title,
            'status'            => $row->status,
            'sequence'          => (int) $row->sequence,
            'received_at'       => $received->toIso8601String(),
            'due_at'            => $dueAt->toIso8601String(),
            'window_seconds'    => (int) $window,
            'elapsed_seconds'   => (int) $elapsed,
            'remaining_seconds' => (int) $remaining,
            'elapsed_percent'   => (int) round($pct * 100),
            'processing_days'   => $row->processing_days ? (int) $row->processing_days : null,
            'tier'              => $tier,
            'key'               => $this->keyFor($row->id, $tier),
            'show_url'          => route('documents.show', $row->id),
        ];
    }

    private function tierFromPct(float $pct, array $cfg): ?string
    {
        if ($pct >= 1.0) {
            return self::TIER_OVERDUE;
        }
        if ($pct >= (float) $cfg['urgent_at']) {
            return self::TIER_URGENT;
        }
        if ($pct >= (float) $cfg['warning_at']) {
            return self::TIER_WARNING;
        }
        if ($pct >= (float) $cfg['info_at']) {
            return self::TIER_INFO;
        }

        return null;
    }

    public function keyFor(int $documentId, string $tier): string
    {
        $resetOnTierChange = (bool) config(
            'document-tracking.reminder.reset_on_tier_change',
            true
        );

        $base = 'doc:' . $documentId . ':date:' . now()->toDateString();

        return $resetOnTierChange ? "{$base}:tier:{$tier}" : $base;
    }

    public function severityRank(string $tier): int
    {
        return match ($tier) {
            self::TIER_OVERDUE => 4,
            self::TIER_URGENT  => 3,
            self::TIER_WARNING => 2,
            self::TIER_INFO    => 1,
            default            => 0,
        };
    }

    /**
     * Insert read records for the given keys (idempotent).
     */
    public function markRead(User $user, array $keys): int
    {
        $keys = collect($keys)
            ->filter(fn ($k) => is_string($k) && $k !== '' && strlen($k) <= 120)
            ->unique()
            ->values()
            ->all();

        if (empty($keys)) {
            return 0;
        }

        $now = now();
        $rows = collect($keys)->map(fn ($key) => [
            'user_id'          => $user->id,
            'notification_key' => $key,
            'read_at'          => $now,
            'created_at'       => $now,
            'updated_at'       => $now,
        ])->all();

        // insertOrIgnore avoids unique-constraint errors on double taps.
        return DB::table('notification_reads')->insertOrIgnore($rows);
    }

    /**
     * Remove read rows older than the retention window.
     */
    public function pruneOldReads(): int
    {
        $days = (int) config('document-tracking.reminder.read_retention_days', 30);

        return NotificationRead::query()
            ->where('read_at', '<', now()->subDays($days))
            ->delete();
    }
}