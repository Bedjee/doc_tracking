<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('office_id')->constrained('offices');
            $table->unsignedInteger('sequence');

            // PENDING | CURRENT | RECEIVED | DONE | SKIPPED
            $table->string('status')->default('PENDING');
            $table->boolean('is_return')->default(false);

            $table->timestamp('received_at')->nullable();
            $table->timestamp('forwarded_at')->nullable();
            $table->timestamps();

            $table->unique(['document_id', 'sequence']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_routes');
    }
};