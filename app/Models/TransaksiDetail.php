<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransaksiDetail extends Model
{
    protected $table = 'transaksi_detail';

    protected $fillable = [
        'transaksi_id',
        'produk_id',
        'varian_id',
        'qty',
        'harga_satuan',
        'subtotal',
    ];

    protected $casts = [
        'qty'           => 'integer',
        'harga_satuan'  => 'decimal:2',
        'subtotal'      => 'decimal:2',
    ];

    /**
     * Relasi ke Transaksi
     */
    public function transaksi()
    {
        return $this->belongsTo(Transaksi::class);
    }

    /**
     * Relasi ke Produk
     */
    public function produk()
    {
        return $this->belongsTo(Produk::class);
    }

    /**
     * Helper hitung subtotal
     */
    public function hitungSubtotal(): float
    {
        return (float) $this->qty * (float) $this->harga_satuan;
    }
}
