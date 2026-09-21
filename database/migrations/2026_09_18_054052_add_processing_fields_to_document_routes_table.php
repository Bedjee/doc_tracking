<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_routes', function (Blueprint $table) {
            // Days the office is allowed for this specific step.
            $table->unsignedSmallInteger('processing_days')->nullable()->after('is_return');

            // Set when the office receives the document: received_at + processing_days.
            $table->timestamp('due_at')->nullable()->after('forwarded_at');
        });
    }

    public function down(): void
    {
        Schema::table('document_routes', function (Blueprint $table) {
            $table->dropColumn(['processing_days', 'due_at']);
        });
    }
};