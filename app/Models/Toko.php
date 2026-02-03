<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Toko extends Model
{
    protected $table = 'toko';

    protected $fillable = [
        'nama_toko',
        'alamat',
        'no_hp',
    ];

    /**
     * Relasi ke User (admin / kasir)
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Relasi ke Produk
     */
    public function produk()
    {
        return $this->hasMany(Produk::class);
    }

    /**
     * Relasi ke Transaksi
     */
    public function transaksi()
    {
        return $this->hasMany(Transaksi::class);
    }
}
