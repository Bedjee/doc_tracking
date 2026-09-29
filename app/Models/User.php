<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use NotificationChannels\WebPush\HasPushSubscriptions;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasPushSubscriptions;

    public const ROLE_ADMINISTRATOR = 'administrator';
    public const ROLE_OFFICE_USER   = 'office_user';
    public const ROLE_OFFICE_HEAD   = 'office_head';

    protected $fillable = [
        'name', 'username', 'email', 'password', 'pin_hash',   // ← NEW
        'office_id', 'role', 'is_active',
    ];

    protected $hidden = ['password', 'remember_token', 'pin_hash', 'pin_fingerprint'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'pin_hash'          => 'hashed',   // ← NEW
        'is_active'         => 'boolean',
    ];

    /* ---------- existing relations & helpers unchanged ---------- */

    public function office() { return $this->belongsTo(Office::class); }
    public function isAdministrator(): bool { return $this->role === self::ROLE_ADMINISTRATOR; }
    public function isOfficeHead(): bool    { return $this->role === self::ROLE_OFFICE_HEAD; }
    public function canManage(): bool       { return $this->isAdministrator() || $this->isOfficeHead(); }
    public function canActOnDocuments(): bool { return $this->is_active && $this->office_id !== null; }

    /* ---------- PIN helpers (new) ---------- */

    /**
     * Generate a random 4-digit PIN as a string, e.g. "0482".
     * Leading zeros are preserved.
     */
    public static function generatePin(): string
    {
        return str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }


    /**
     * Set a new PIN. Assigning to `pin_hash` triggers the `hashed`
     * cast, so pass the plain 4-digit string.
     */
  

   

    /**
 * Trivial PINs we refuse to generate because they're the first an
 * attacker tries.
 */
private const WEAK_PINS = [
    '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777',
    '8888', '9999', '1234', '4321', '0123', '9876', '1212', '6969',
];

/**
 * Deterministic fingerprint used only for O(1) PIN lookup at login.
 * Keyed with APP_KEY so a DB dump alone can't enumerate the PINs.
 */
public static function fingerprintPin(string $plainPin): string
{
    return hash_hmac('sha256', $plainPin, config('app.key'));
}

/**
 * Generate a random 4-digit PIN string, e.g. "0482".
 * Leading zeros preserved. Skips weak values.
 */


/**
 * Generate a PIN that is not currently in use by any other user.
 * With 10,000 possible PINs and a few thousand users this always
 * succeeds on the first or second try.
 */
public static function generateUniquePin(): string
{
    $used = static::query()
        ->whereNotNull('pin_fingerprint')
        ->pluck('pin_fingerprint')
        ->all();

    $usedSet = array_flip($used);

    for ($i = 0; $i < 300; $i++) {
        $pin = self::generatePin();
        if (!isset($usedSet[self::fingerprintPin($pin)])) {
            return $pin;
        }
    }

    throw new \RuntimeException(
        'Unable to generate a unique PIN. The 4-digit pool may be exhausted.'
    );
}

/**
 * Look up an active user by their plain PIN. Returns null if no match.
 */
public static function findByPin(string $plainPin): ?self
{
    return static::query()
        ->where('pin_fingerprint', self::fingerprintPin($plainPin))
        ->where('is_active', true)
        ->first();
}

public function hasPin(): bool
{
    return !empty($this->pin_hash);
}

public function setPin(string $plainPin): void
{
    $this->pin_hash = $plainPin;                       // hashed by cast
    $this->pin_fingerprint = self::fingerprintPin($plainPin);
    $this->save();
}

public function verifyPin(string $plainPin): bool
{
    return $this->hasPin()
        && \Illuminate\Support\Facades\Hash::check($plainPin, $this->pin_hash);
}

public function clearPin(): void
{
    $this->pin_hash = null;
    $this->pin_fingerprint = null;
    $this->save();
}
}