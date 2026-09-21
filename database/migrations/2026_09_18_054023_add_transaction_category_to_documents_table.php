<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('transaction_category_id')
                ->nullable()
                ->after('document_type_id')
                ->constrained('transaction_categories')
                ->nullOnDelete();

            // Snapshot: the actual days applied per office, frozen at creation
            // time. Historical documents are not affected by later category edits.
            $table->unsignedSmallInteger('processing_days_per_office')
                ->nullable()
                ->after('transaction_category_id');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('transaction_category_id');
            $table->dropColumn('processing_days_per_office');
        });
    }
};