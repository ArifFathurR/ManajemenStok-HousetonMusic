<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('kategori', function (Blueprint $table) {
            $table->id();
            $table->string('nama_kategori')->unique();
            $table->timestamps();
        });

        Schema::table('produk', function (Blueprint $table) {
            // Hapus kolom lama jika masih ada
            if (Schema::hasColumn('produk', 'kategori')) {
                $table->dropColumn('kategori');
            }
            // Tambah foreign key ke kategori global
            if (!Schema::hasColumn('produk', 'kategori_id')) {
                $table->foreignId('kategori_id')->nullable()->constrained('kategori')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kategori');
    }
};
