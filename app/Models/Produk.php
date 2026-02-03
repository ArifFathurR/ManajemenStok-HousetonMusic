<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    protected $table = 'produk';

    protected $fillable = [
        'toko_id',
        'nama_produk',
        'kategori',
        'stok',
        'satuan',
        'harga_online',
        'harga_offline',
        'deskripsi',
    ];

    protected $casts = [
        'harga_online'  => 'decimal:2',
        'harga_offline' => 'decimal:2',
        'stok'          => 'integer',
    ];

    /**
     * Relasi ke Toko
     */
    public function toko()
    {
        return $this->belongsTo(Toko::class);
    }

    /**
     * Relasi ke detail transaksi
     */
    public function transaksiDetail()
    {
        return $this->hasMany(TransaksiDetail::class, 'produk_id');
    }

    /**
     * Helper ambil harga berdasarkan channel
     */
    public function getHargaByChannel(string $channel): float
    {
        return $channel === 'online'
            ? (float) $this->harga_online
            : (float) $this->harga_offline;
    }

    /**
     * Scope produk yang stok hampir habis
     */
    public function scopeStokMenipis($query, int $min = 5)
    {
        return $query->where('stok', '<=', $min);
    }
}
