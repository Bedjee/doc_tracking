<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentEvent extends Model
{
    public const TYPE_CREATED   = 'CREATED';
    public const TYPE_RECEIVED  = 'RECEIVED';
    public const TYPE_FORWARDED = 'FORWARDED';
    public const TYPE_RETURNED  = 'RETURNED';
    public const TYPE_COMPLETED = 'COMPLETED';
    public const TYPE_CANCELLED = 'CANCELLED';

    protected $fillable = [
        'document_id', 'event_type', 'from_office_id', 'to_office_id',
        'performed_by', 'remarks', 'meta',
    ];

    protected $casts = ['meta' => 'array'];

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function fromOffice()
    {
        return $this->belongsTo(Office::class, 'from_office_id');
    }

    public function toOffice()
    {
        return $this->belongsTo(Office::class, 'to_office_id');
    }

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}