<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransactionCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'code', 'description', 'min_days', 'max_days', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'min_days'  => 'integer',
        'max_days'  => 'integer',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /** Human label: "3 days" or "20–30 days". */
    public function getRangeLabelAttribute(): string
    {
        if ($this->min_days === $this->max_days) {
            return $this->min_days . ' ' . str('day')->plural($this->min_days);
        }
        return $this->min_days . '–' . $this->max_days . ' days';
    }

    /** The value actually applied to new documents. */
    public function defaultDays(): int
    {
        // For a range, default to the maximum (most generous to the office).
        return (int) $this->max_days;
    }
}