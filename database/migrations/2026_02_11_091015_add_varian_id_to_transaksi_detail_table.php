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
        Schema::table('transaksi_detail', function (Blueprint $table) {
            $table->foreignId('varian_id')->nullable()->after('produk_id')->constrained('produk_varian')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaksi_detail', function (Blueprint $table) {
            $table->dropForeign(['varian_id']);
            $table->dropColumn('varian_id');
        });
    }
};
