<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class KategoriSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Grade Premium',
            'Grade A Meranti',
            'Grade Medium',
            'Grade Semi',
            'Grade TB',
            'Grade Pemula'
        ];

        foreach ($categories as $category) {
            \App\Models\Kategori::firstOrCreate([
                'nama_kategori' => $category
            ]);
        }
    }
}
