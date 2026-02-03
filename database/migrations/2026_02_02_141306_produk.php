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
            $table->string('kategori')->nullable();
            $table->text('deskripsi')->nullable();
            $table->string('gambar_utama')->nullable();
            $table->boolean('is_variant')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produk');
    }
};
