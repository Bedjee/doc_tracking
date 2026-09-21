<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->boolean('return_to_sender')
                ->default(false)
                ->after('processing_days_per_office');
        });

        Schema::table('document_routes', function (Blueprint $table) {
            // Marks the final step when it exists specifically because the
            // document must come back to the sender. Distinct from `is_return`,
            // which records a return exception mid-route.
            $table->boolean('is_return_to_sender')
                ->default(false)
                ->after('is_return');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn('return_to_sender');
        });

        Schema::table('document_routes', function (Blueprint $table) {
            $table->dropColumn('is_return_to_sender');
        });
    }
};