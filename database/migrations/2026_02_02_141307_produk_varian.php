<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('produk_varian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produk_id')
                  ->constrained('produk')
                  ->cascadeOnDelete();
            $table->string('nama_varian')->nullable();
            // SKU (Boleh kosong sesuai diskusi tadi)
            $table->string('sku')->nullable();
            $table->integer('stok')->default(0);
            $table->string('satuan')->default('pcs');
            $table->decimal('harga_online', 12, 2);
            $table->decimal('harga_offline', 12, 2);
            $table->string('gambar')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produk_varian');
    }
};
