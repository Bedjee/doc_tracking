<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('name');
            $table->foreignId('office_id')->nullable()->after('username')
                ->constrained('offices')->nullOnDelete();
            $table->string('role')->default('office_user')->after('office_id');
            $table->boolean('is_active')->default(true)->after('role');
            $table->index(['office_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('office_id');
            $table->dropColumn(['username', 'role', 'is_active']);
        });
    }
};