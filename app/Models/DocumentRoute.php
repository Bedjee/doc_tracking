<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentRoute extends Model
{
    public const STATUS_PENDING  = 'PENDING';
    public const STATUS_CURRENT  = 'CURRENT';
    public const STATUS_RECEIVED = 'RECEIVED';
    public const STATUS_DONE     = 'DONE';
    public const STATUS_SKIPPED  = 'SKIPPED';

    protected $fillable = [
    'document_id', 'office_id', 'sequence', 'status',
    'is_return', 'is_return_to_sender',                         // ← new
    'processing_days',
    'received_at', 'forwarded_at', 'due_at',
];

protected $casts = [
    'received_at'         => 'datetime',
    'forwarded_at'        => 'datetime',
    'due_at'              => 'datetime',
    'is_return'           => 'boolean',
    'is_return_to_sender' => 'boolean',                         // ← new
    'processing_days'     => 'integer',
];



    protected $appends = [
        'processing_seconds',
        'elapsed_seconds',
        'remaining_seconds',
        'is_overdue',
        'progress_percent',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    /* ---------------- timing accessors ---------------- */

    /** Total seconds allowed for this step. */
    public function getProcessingSecondsAttribute(): ?int   // ← an ACCESSOR
    {
        return $this->processing_days ? $this->processing_days * 86400 : null;
    }

    public function getElapsedSecondsAttribute(): ?int
    {
        if (!$this->received_at) {
            return null;
        }
        $end = $this->forwarded_at ?? now();
        return (int) $this->received_at->diffInSeconds($end, false);
    }

    public function getRemainingSecondsAttribute(): ?int
    {
        if (!$this->due_at || !$this->received_at) {
            return null;
        }
        $reference = $this->forwarded_at ?? now();
        return (int) $reference->diffInSeconds($this->due_at, false);
    }

    public function getIsOverdueAttribute(): bool
    {
        $remaining = $this->remaining_seconds;
        return $remaining !== null && $remaining < 0;
    }

    public function getProgressPercentAttribute(): ?int
    {
        $total = $this->processing_seconds;
        $elapsed = $this->elapsed_seconds;
        if (!$total || $elapsed === null) {
            return null;
        }
        return max(0, min(999, (int) round(($elapsed / $total) * 100)));
    }
}