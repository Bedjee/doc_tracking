<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Key format: doc:{id}:date:{yyyy-mm-dd}:tier:{tier}
            // The tier suffix means escalation breaks a previous dismissal.
            $table->string('notification_key', 120);

            $table->timestamp('read_at')->useCurrent();
            $table->timestamps();

            $table->unique(['user_id', 'notification_key'], 'notification_reads_unique');
            $table->index('read_at'); // for pruning
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_reads');
    }
};