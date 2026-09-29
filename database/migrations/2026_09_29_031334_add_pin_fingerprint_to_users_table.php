<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Deterministic HMAC-SHA256 of the PIN, keyed with APP_KEY.
            // Used only so the login controller can look up the user by
            // PIN in O(1). Never exposed to the frontend.
            $table->string('pin_fingerprint', 64)
                ->nullable()
                ->after('pin_hash');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('pin_fingerprint');
        });
    }
};