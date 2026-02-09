<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transaksi', function (Blueprint $table) {
            $table->id();
            $table->string('kode_transaksi');
            $table->foreignId('toko_id')
                ->constrained('toko')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('channel', ['online', 'offline']);
            $table->enum('metode_pembayaran', ['cash', 'debit', 'qr', 'split']);

            $table->decimal('total', 14, 2);
            $table->decimal('diskon_nominal', 14, 2)->default(0);
            $table->decimal('grand_total', 14, 2);

            $table->timestamp('tanggal');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaksi');
    }
};
