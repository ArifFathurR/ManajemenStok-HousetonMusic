<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    protected $table = 'transaksi';

    protected $fillable = [
        'toko_id',
        'kode_transaksi',
        'user_id',
        'channel',
        'metode_pembayaran',
        'total',
        'diskon_nominal',
        'grand_total',
        'tanggal',
    ];

    protected $casts = [
        'tanggal'         => 'datetime',
        'total'           => 'decimal:2',
        'diskon_nominal'  => 'decimal:2',
        'grand_total'     => 'decimal:2',
    ];

    /**
     * Relasi ke Toko
     */
    public function toko()
    {
        return $this->belongsTo(Toko::class);
    }

    /**
     * Relasi ke User (Kasir)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi ke detail transaksi
     */
    public function detail()
    {
        return $this->hasMany(TransaksiDetail::class, 'transaksi_id');
    }

    public function pembayaran()
    {
        return $this->hasMany(TransaksiPembayaran::class, 'transaksi_id');
    }

    /**
     * Scope transaksi online
     */
    public function scopeOnline($query)
    {
        return $query->where('channel', 'online');
    }

    /**
     * Scope transaksi offline
     */
    public function scopeOffline($query)
    {
        return $query->where('channel', 'offline');
    }

    /**
     * Helper hitung ulang grand total
     */
    public function hitungGrandTotal(): float
    {
        return max(0, (float) $this->total - (float) $this->diskon_nominal);
    }
}
