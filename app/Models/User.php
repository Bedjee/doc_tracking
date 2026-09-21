<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public const ROLE_ADMINISTRATOR = 'administrator';
    public const ROLE_OFFICE_USER   = 'office_user';
    public const ROLE_OFFICE_HEAD   = 'office_head';

    protected $fillable = [
        'name', 'username', 'email', 'password',
        'office_id', 'role', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'is_active'         => 'boolean',
    ];

    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    public function isAdministrator(): bool
    {
        return $this->role === self::ROLE_ADMINISTRATOR;
    }

    public function isOfficeHead(): bool
    {
        return $this->role === self::ROLE_OFFICE_HEAD;
    }

    public function canManage(): bool
    {
        return $this->isAdministrator() || $this->isOfficeHead();
    }

    /** A user must be active AND assigned to an office to act on documents. */
    public function canActOnDocuments(): bool
    {
        return $this->is_active && $this->office_id !== null;
    }
}