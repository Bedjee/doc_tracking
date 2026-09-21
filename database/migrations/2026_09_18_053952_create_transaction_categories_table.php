<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('description')->nullable();

            // Range allowed for this category (e.g. 20–30 for Highly Technical).
            // For fixed categories set min == max (3/3, 7/7).
            $table->unsignedSmallInteger('min_days');
            $table->unsignedSmallInteger('max_days');

            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_categories');
    }
};