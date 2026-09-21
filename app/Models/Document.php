<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_CREATED   = 'CREATED';
    public const STATUS_ONGOING   = 'ONGOING';
    public const STATUS_RECEIVED  = 'RECEIVED';
    public const STATUS_COMPLETED = 'COMPLETED';
    public const STATUS_RETURNED  = 'RETURNED';
    public const STATUS_CANCELLED = 'CANCELLED';

    public const STATUSES = [
        self::STATUS_CREATED,
        self::STATUS_ONGOING,
        self::STATUS_RECEIVED,
        self::STATUS_COMPLETED,
        self::STATUS_RETURNED,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
    'tracking_number', 'title', 'document_type_id',
    'transaction_category_id', 'processing_days_per_office',
    'return_to_sender',                                        // ← new
    'reference_number', 'document_date', 'subject',
    'originating_office_id', 'created_by',
    'current_office_id', 'current_destination_office_id',
    'status', 'remarks', 'document_image_path', 'ocr_raw_text',
    'completed_at',
];

protected $casts = [
    'document_date'      => 'date',
    'completed_at'       => 'datetime',
    'return_to_sender'   => 'boolean',                          // ← new
];



    /* ---------- Relations ---------- */

    public function type()
    {
        return $this->belongsTo(DocumentType::class, 'document_type_id');
    }

    public function originatingOffice()
    {
        return $this->belongsTo(Office::class, 'originating_office_id');
    }

    public function currentOffice()
    {
        return $this->belongsTo(Office::class, 'current_office_id');
    }

    public function currentDestination()
    {
        return $this->belongsTo(Office::class, 'current_destination_office_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function routes()
    {
        return $this->hasMany(DocumentRoute::class)->orderBy('sequence');
    }

    public function events()
    {
        return $this->hasMany(DocumentEvent::class)->latest();
    }

    /* ---------- Helpers ---------- */

    public function currentRouteStep(): ?DocumentRoute
    {
        return $this->routes()->where('status', DocumentRoute::STATUS_CURRENT)->first();
    }

    public function routeStepForOffice(int $officeId): ?DocumentRoute
    {
        return $this->routes()
            ->where('office_id', $officeId)
            ->whereIn('status', [DocumentRoute::STATUS_CURRENT, DocumentRoute::STATUS_RECEIVED])
            ->latest('sequence')
            ->first();
    }

    public function isFinalDestination(): bool
    {
        $max = $this->routes()->max('sequence');
        $step = $this->currentRouteStep();

        return $step && (int) $step->sequence === (int) $max;
    }

    public function isLocked(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_CANCELLED], true);
    }

    /** Total routing time in seconds from creation to completion. */
    public function totalRoutingSeconds(): ?int
    {
        if (!$this->completed_at) {
            return null;
        }

        return $this->created_at->diffInSeconds($this->completed_at);
    }

    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isAdministrator()) {
            return $query;
        }

        return $query->where(function ($q) use ($user) {
            $q->where('created_by', $user->id)
              ->orWhere('originating_office_id', $user->office_id)
              ->orWhere('current_office_id', $user->office_id)
              ->orWhere('current_destination_office_id', $user->office_id)
              ->orWhereHas('routes', fn ($r) => $r->where('office_id', $user->office_id));
        });
    }


    public function transactionCategory()
{
    return $this->belongsTo(TransactionCategory::class);
}

/** Processing window per office, in seconds. */
public function perOfficeProcessingSeconds(): ?int
{
    return $this->processing_days_per_office
        ? $this->processing_days_per_office * 86400
        : null;
}

/** The route step currently in flight (CURRENT or RECEIVED). */
public function activeRouteStep(): ?DocumentRoute
{
    return $this->routes()
        ->whereIn('status', [DocumentRoute::STATUS_CURRENT, DocumentRoute::STATUS_RECEIVED])
        ->orderBy('sequence')
        ->first();
}
}