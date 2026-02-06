<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Produk extends Model
{
    protected $table = 'produk';

    protected $guarded = ['id'];

    public function varian(): HasMany
    {
        return $this->hasMany(ProdukVarian::class, 'produk_id');
    }

    public function kategoriRelasi()
    {
        return $this->belongsTo(Kategori::class, 'kategori_id');
    }
}
