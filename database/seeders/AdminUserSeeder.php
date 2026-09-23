<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Create or update the administrator account.
     *
     * Idempotent:
     *   - If the account does not exist → creates it.
     *   - If it exists and ADMIN_FORCE_UPDATE is NOT set → skips (safe default).
     *   - If it exists and ADMIN_FORCE_UPDATE=true → updates name / email /
     *     password to match the values in .env. Useful when you need to
     *     reset credentials during deployment.
     *
     * Configuration (.env):
     *   ADMIN_NAME           (default: System Administrator)
     *   ADMIN_USERNAME       (default: admin)
     *   ADMIN_EMAIL          (default: admin@opol.gov.ph)
     *   ADMIN_PASSWORD       (default: randomly generated and printed once)
     *   ADMIN_FORCE_UPDATE   (default: false)
     *
     * Run with:
     *   php artisan db:seed --class=AdminUserSeeder
     */
    public function run(): void
    {
        $username = (string) (env('ADMIN_USERNAME') ?: 'admin');
        $email    = (string) (env('ADMIN_EMAIL')    ?: 'admin@opol.gov.ph');
        $name     = (string) (env('ADMIN_NAME')     ?: 'System Administrator');

        $forceUpdate = filter_var(
            env('ADMIN_FORCE_UPDATE', false),
            FILTER_VALIDATE_BOOLEAN
        );

        $existing = User::where('username', $username)->first();

        /* ==============================================================
         *  Case 1 — account already exists
         * ============================================================== */
        if ($existing) {
            if (!$forceUpdate) {
                $this->command->warn('');
                $this->command->warn(
                    "Administrator '{$username}' already exists "
                    . "(id: {$existing->id}, role: {$existing->role})."
                );
                $this->command->warn(
                    'Seeder skipped. To force an update, set ADMIN_FORCE_UPDATE=true in .env.'
                );
                $this->command->warn('');
                return;
            }

            // Force-update path.
            $updates = [
                'name'      => $name,
                'email'     => $email,
                'role'      => User::ROLE_ADMINISTRATOR,
                'is_active' => true,
            ];

            $plainPassword = env('ADMIN_PASSWORD');
            $generated = false;

            if (!empty($plainPassword)) {
                // Assigning the plain value; the model's 'hashed' cast
                // handles the hashing on save.
                $updates['password'] = $plainPassword;
            } else {
                $plainPassword = $this->generatePassword();
                $updates['password'] = $plainPassword;
                $generated = true;
            }

            $existing->update($updates);

            $this->command->info('');
            $this->command->info('══════════════════════════════════════════════════════════');
            $this->command->info('  Administrator account updated');
            $this->command->info('══════════════════════════════════════════════════════════');
            $this->command->info("  Name      : {$existing->fresh()->name}");
            $this->command->info("  Username  : {$existing->username}");
            $this->command->info("  Email     : {$existing->fresh()->email}");
            $this->command->info("  Password  : {$plainPassword}");
            $this->command->info("  Role      : {$existing->role}");
            $this->command->info("  Active    : " . ($existing->fresh()->is_active ? 'yes' : 'no'));
            $this->command->info('══════════════════════════════════════════════════════════');

            if ($generated) {
                $this->command->warn('');
                $this->command->warn('  ⚠  Randomly generated password — save it now.');
            }

            $this->command->info('');
            return;
        }

        /* ==============================================================
         *  Case 2 — account does not exist; create it
         * ============================================================== */
        $plainPassword = env('ADMIN_PASSWORD');

        if (empty($plainPassword)) {
            $plainPassword = $this->generatePassword();
            $generated = true;
        } else {
            $generated = false;
        }

        $admin = User::create([
            'name'      => $name,
            'username'  => $username,
            'email'     => $email,
            'password'  => $plainPassword,
            'office_id' => null,
            'role'      => User::ROLE_ADMINISTRATOR,
            'is_active' => true,
        ]);

        $this->command->info('');
        $this->command->info('══════════════════════════════════════════════════════════');
        $this->command->info('  Administrator account created successfully');
        $this->command->info('══════════════════════════════════════════════════════════');
        $this->command->info("  Name      : {$admin->name}");
        $this->command->info("  Username  : {$admin->username}");
        $this->command->info("  Email     : {$admin->email}");
        $this->command->info("  Password  : {$plainPassword}");
        $this->command->info("  Role      : {$admin->role}");
        $this->command->info("  Active    : " . ($admin->is_active ? 'yes' : 'no'));
        $this->command->info('══════════════════════════════════════════════════════════');

        if ($generated) {
            $this->command->warn('');
            $this->command->warn('  ⚠  Randomly generated password — save it now.');
            $this->command->warn('     Set ADMIN_PASSWORD in .env to control it on the next run.');
        }

        $this->command->info('');
    }

    private function generatePassword(int $length = 16): string
    {
        return Str::password($length, symbols: true);
    }
}