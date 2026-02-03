<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ProdukController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Dummy data untuk list produk
        $produk = [
            [
                'id' => 1,
                'nama_produk' => 'Apple AirPods Max (USB-C)',
                'kategori' => 'Accessories',
                'stok' => 25,
                'satuan' => 'pcs',
                'harga_online' => 8594000,
                'harga_offline' => 8500000,
            ],
            [
                'id' => 2,
                'nama_produk' => 'iPhone 15 Pro Max',
                'kategori' => 'Electronics',
                'stok' => 15,
                'satuan' => 'pcs',
                'harga_online' => 22999000,
                'harga_offline' => 22500000,
            ],
            [
                'id' => 3,
                'nama_produk' => 'MacBook Pro M3',
                'kategori' => 'Electronics',
                'stok' => 8,
                'satuan' => 'pcs',
                'harga_online' => 35999000,
                'harga_offline' => 35500000,
            ],
        ];

        return Inertia::render('Produk/Index', [
            'produk' => $produk
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Produk/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Untuk sementara hanya redirect dengan message
        return redirect()->route('produk.index')
            ->with('success', 'Produk berhasil ditambahkan (dummy).');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        // Dummy data produk detail
        $produk = [
            'id' => $id,
            'nama_produk' => 'Apple AirPods Max (USB-C)',
            'kategori' => 'Accessories',
            'stok' => 25,
            'satuan' => 'pcs',
            'harga_online' => 8594000,
            'harga_offline' => 8500000,
            'deskripsi' => 'AirPods Max, the ultimate listening experience. Now available in five new colors. Apple-designed drivers deliver high-fidelity audio. Every detail, from the canopy to the cushions, has been conceived with incredible precision in mind, blowing precision headsets. Pre-level Active Noise Cancellation 1 blocks out outside noise, while Transparency mode lets you converse with your surroundings. Lightweight. USB-C connector for audio connections charging. AirPods Max come in five fresh colors: Midnight, Starlight, Blue, Purple, and Orange.',
            'image_url' => 'https://images.unsplash.com/photo-1625298378605-0ff5a3d13f0d?w=500',
            'created_at' => '2024-01-15',
            'updated_at' => '2024-02-03',
        ];

        return Inertia::render('Produk/Detail', [
            'produk' => $produk
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        // Dummy data untuk edit
        $produk = [
            'id' => $id,
            'nama_produk' => 'Apple AirPods Max (USB-C)',
            'kategori' => 'Accessories',
            'stok' => 25,
            'satuan' => 'pcs',
            'harga_online' => 8594000,
            'harga_offline' => 8500000,
            'deskripsi' => 'AirPods Max, the ultimate listening experience.',
        ];

        return Inertia::render('Produk/Edit', [
            'produk' => $produk
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        // Untuk sementara hanya redirect dengan message
        return redirect()->route('produk.show', $id)
            ->with('success', 'Produk berhasil diperbarui (dummy).');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        // Untuk sementara hanya redirect dengan message
        return redirect()->route('produk.index')
            ->with('success', 'Produk berhasil dihapus (dummy).');
    }
}
