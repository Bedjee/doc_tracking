<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number')->unique();
            $table->string('title');
            $table->foreignId('document_type_id')->nullable()
                ->constrained('document_types')->nullOnDelete();
            $table->string('reference_number')->nullable();
            $table->date('document_date')->nullable();
            $table->text('subject')->nullable();

            $table->foreignId('originating_office_id')->constrained('offices');
            $table->foreignId('created_by')->constrained('users');

            $table->foreignId('current_office_id')->nullable()->constrained('offices');
            $table->foreignId('current_destination_office_id')->nullable()->constrained('offices');

            $table->string('status')->default('CREATED');
            $table->text('remarks')->nullable();

            $table->string('document_image_path')->nullable();
            $table->longText('ocr_raw_text')->nullable();

            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('tracking_number');
            $table->index('current_destination_office_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};