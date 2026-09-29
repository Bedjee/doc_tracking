<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Document forwarding reminders
    |--------------------------------------------------------------------------
    |
    | Documents that have been received by an office but not yet forwarded
    | trigger in-app reminders. The tier is derived from what fraction of
    | the office's allowed processing window has been used:
    |
    |   elapsed / window  <  info_at    → silent
    |                     ≥  info_at    → info
    |                     ≥  warning_at → warning
    |                     ≥  urgent_at  → urgent
    |                     ≥  1.0        → overdue
    |
    | The reminder is always suppressed during the first N hours after
    | receipt, regardless of window size, so short 3-day documents don't
    | nag on the same afternoon they arrive.
    |
    */
    'reminder' => [
    /*
     * Absolute floor: no reminder fires before this many MINUTES.
     * Default 1440 = 24 hours. Override with REMINDER_MIN_MINUTES for
     * testing (e.g. 1 to fire one minute after receipt).
     */
    'min_minutes' => (int) env('REMINDER_MIN_MINUTES', 1440),

    /*
     * Tier thresholds, as fractions of the office's processing window
     * used (0–1). Override via .env for testing.
     */
    'info_at'    => (float) env('REMINDER_INFO_AT', 0.30),
    'warning_at' => (float) env('REMINDER_WARNING_AT', 0.60),
    'urgent_at'  => (float) env('REMINDER_URGENT_AT', 0.85),

    'reset_on_tier_change' => (bool) env('REMINDER_RESET_ON_TIER', true),
    'read_retention_days'  => (int) env('REMINDER_READ_RETENTION', 30),
],




    /*
    |--------------------------------------------------------------------------
    | Notification audio
    |--------------------------------------------------------------------------
    */
    'audio' => [
        // Default state of the mute toggle for new users.
        'default_enabled' => env('REMINDER_AUDIO_DEFAULT', true),
    ],
];