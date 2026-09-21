<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();

            // CREATED | RECEIVED | FORWARDED | RETURNED | COMPLETED | CANCELLED
            $table->string('event_type');

            $table->foreignId('from_office_id')->nullable()->constrained('offices');
            $table->foreignId('to_office_id')->nullable()->constrained('offices');
            $table->foreignId('performed_by')->nullable()->constrained('users');

            $table->text('remarks')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['document_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_events');
    }
};