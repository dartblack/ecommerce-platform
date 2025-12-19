<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('type', ['adjustment', 'sale', 'return', 'damage', 'transfer_in', 'transfer_out', 'initial_stock'])->default('adjustment');
            $table->integer('quantity_change'); // Positive for additions, negative for removals
            $table->integer('quantity_before'); // Stock level before this movement
            $table->integer('quantity_after'); // Stock level after this movement
            $table->text('reason')->nullable(); // Reason for the movement
            $table->text('notes')->nullable(); // Additional notes
            $table->string('reference_number')->nullable(); // PO number, invoice number, etc.
            $table->timestamps();

            $table->index('product_id');
            $table->index('user_id');
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};

