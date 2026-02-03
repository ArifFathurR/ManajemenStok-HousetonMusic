<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    protected $table = 'transaksi'; 
    protected $guarded = ['id'];

    protected $casts = [
        'tanggal' => 'datetime',
    ];

    // Relasi ke Detail
    public function details()
    {
        return $this->hasMany(TransaksiDetail::class, 'transaksi_id');
    }
}
