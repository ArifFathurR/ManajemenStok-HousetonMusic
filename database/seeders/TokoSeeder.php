<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TokoSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('toko')->insert([
            [
                'nama_toko' => 'Toko 1',
                'alamat' => 'Jl. Sudirman No. 12',
                'no_hp' => '081234567890',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama_toko' => 'Toko 1',
                'alamat' => 'Jl. Diponegoro No. 5',
                'no_hp' => '082345678901',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama_toko' => 'Toko 3',
                'alamat' => 'Jl. Ahmad Yani No. 20',
                'no_hp' => '083456789012',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama_toko' => 'Toko 4',
                'alamat' => 'Jl. Kartini No. 7',
                'no_hp' => '084567890123',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama_toko' => 'Toko 5',
                'alamat' => 'Jl. Gajah Mada No. 3',
                'no_hp' => '085678901234',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
