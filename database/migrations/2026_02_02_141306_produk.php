<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('produk', function (Blueprint $table) {
            $table->id();
            $table->foreignId('toko_id')
                  ->constrained('toko')
                  ->cascadeOnDelete();

            $table->string('nama_produk');
            $table->string('kategori')->nullable(); // input manual
            $table->integer('stok')->default(0);
            $table->string('satuan')->nullable();
            $table->decimal('harga_online', 12, 2);
            $table->decimal('harga_offline', 12, 2);
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produk');
    }
};
