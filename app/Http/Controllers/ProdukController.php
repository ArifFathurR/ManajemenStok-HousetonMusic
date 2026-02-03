<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use App\Models\ProdukVarian;
use App\Http\Requests\StoreProdukRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ProdukController extends Controller
{
    public function index()
    {
        $userTokoId = Auth::user()->toko_id;

        $produkRaw = Produk::with('varian')
            ->where('toko_id', $userTokoId)
            ->latest()
            ->get();

        $produk = $produkRaw->map(function ($item) {
            $varianUtama = $item->varian->first();

            $totalStok = $item->varian->sum('stok');

            $adaVarianHabis = $item->is_variant && $item->varian->contains('stok', 0);

            return [
                'id' => $item->id,
                'nama_produk' => $item->nama_produk,
                'kategori' => $item->kategori,
                'satuan' => $item->satuan ?? 'Pcs',
                'gambar' => $item->gambar_utama,

                'stok' => $totalStok,
                'ada_varian_habis' => $adaVarianHabis,

                'harga_online' => $varianUtama ? $varianUtama->harga_online : 0,
                'harga_offline' => $varianUtama ? $varianUtama->harga_offline : 0,
            ];
        });

        return Inertia::render('Produk/Index', [
            'produk' => $produk
        ]);
    }

    public function create()
    {
        return Inertia::render('Produk/Create');
    }

    public function store(StoreProdukRequest $request)
    {
        DB::transaction(function () use ($request) {

            // 1. Upload Gambar Utama (Parent)
            $pathGambarUtama = null;
            if ($request->hasFile('gambar')) {
                $pathGambarUtama = $request->file('gambar')->store('produk', 'public');
            }

            // 2. Simpan Parent
            $produk = Produk::create([
                'toko_id' => Auth::user()->toko_id,
                'nama_produk' => $request->nama_produk,
                'kategori' => $request->kategori,
                'satuan' => $request->satuan,
                'deskripsi' => $request->deskripsi,
                'gambar_utama' => $pathGambarUtama,
                'is_variant' => $request->is_variant,
            ]);

            // 3. Simpan Varian
            if ($request->is_variant) {
                // Loop varian
                foreach ($request->varians as $index => $v) {

                    // Logic Simpan Gambar Varian
                    // Kita akses file menggunakan index array request
                    $pathGambarVarian = null;
                    if ($request->hasFile("varians.$index.gambar")) {
                        $pathGambarVarian = $request->file("varians.$index.gambar")->store('varian', 'public');
                    }

                    ProdukVarian::create([
                        'produk_id' => $produk->id,
                        'nama_varian' => $v['nama_varian'],
                        'stok' => $v['stok'],
                        'harga_online' => $v['harga_online'],
                        'harga_offline' => $v['harga_offline'],
                        'sku' => null,
                        'gambar' => $pathGambarVarian, // Simpan Path
                    ]);
                }
            } else {
                // Produk Tunggal
                ProdukVarian::create([
                    'produk_id' => $produk->id,
                    'nama_varian' => 'Default',
                    'stok' => $request->stok,
                    'harga_online' => $request->harga_online,
                    'harga_offline' => $request->harga_offline,
                    'sku' => null,
                    'gambar' => null, // Pakai gambar parent biasanya
                ]);
            }
        });

        return redirect()->route('produk.index')->with('success', 'Produk berhasil ditambahkan!');
    }

    public function edit($id)
    {
        $produk = Produk::with('varian')->where('toko_id', Auth::user()->toko_id)->findOrFail($id);

        return Inertia::render('Produk/Edit', [
            'produk' => $produk
        ]);
    }

    public function update(Request $request, $id)
    {
        $produk = Produk::where('toko_id', Auth::user()->toko_id)->findOrFail($id);

        // Validasi Sederhana (Bisa dipisah ke Request khusus)
        $request->validate([
            'nama_produk' => 'required|string|max:255',
            'satuan' => 'required|string',
            'is_variant' => 'required|boolean',
            'gambar' => 'nullable', // Bisa string (url lama) atau file (upload baru)
        ]);

        DB::transaction(function () use ($request, $produk) {

            // 1. UPDATE PARENT
            $dataParent = [
                'nama_produk' => $request->nama_produk,
                'kategori' => $request->kategori,
                'satuan' => $request->satuan,
                'deskripsi' => $request->deskripsi,
                'is_variant' => $request->is_variant,
            ];

            // Cek ganti gambar parent
            if ($request->hasFile('gambar')) {
                // Hapus lama jika ada
                if ($produk->gambar_utama)
                    Storage::disk('public')->delete($produk->gambar_utama);
                $dataParent['gambar_utama'] = $request->file('gambar')->store('produk', 'public');
            }

            $produk->update($dataParent);

            // 2. LOGIC VARIAN (SYNC)

            // KASUS A: Pindah ke SINGLE PRODUK (Hapus semua varian, reset jadi Default)
            if ($request->is_variant == false) {
                // Hapus semua varian lama
                $produk->varian()->delete();

                // Buat 1 varian default baru
                ProdukVarian::create([
                    'produk_id' => $produk->id,
                    'nama_varian' => 'Default',
                    'stok' => $request->stok, // Dari input single
                    'harga_online' => $request->harga_online,
                    'harga_offline' => $request->harga_offline,
                ]);
            }
            // KASUS B: Mode VARIAN
            else {
                // 1. Ambil semua ID varian yang dikirim dari form
                // (Filter yang punya ID saja, varian baru ID-nya null/undefined)
                $sentIds = collect($request->varians)->pluck('id')->filter()->toArray();

                // 2. Hapus varian di Database yang TIDAK ADA di form (User menghapus baris)
                ProdukVarian::where('produk_id', $produk->id)
                    ->whereNotIn('id', $sentIds)
                    ->delete();

                // 3. Loop update/create
                foreach ($request->varians as $v) {
                    $varianData = [
                        'produk_id' => $produk->id,
                        'nama_varian' => $v['nama_varian'],
                        'stok' => $v['stok'],
                        'harga_online' => $v['harga_online'],
                        'harga_offline' => $v['harga_offline'],
                    ];

                    // Handle Gambar Varian
                    if (isset($v['gambar']) && $v['gambar'] instanceof \Illuminate\Http\UploadedFile) {
                        $varianData['gambar'] = $v['gambar']->store('varian', 'public');
                    }

                    if (isset($v['id'])) {
                        // UPDATE Existing
                        ProdukVarian::where('id', $v['id'])->update($varianData);
                    } else {
                        // CREATE New (Baris baru ditambahkan user)
                        ProdukVarian::create($varianData);
                    }
                }
            }
        });

        return redirect()->route('produk.index')->with('success', 'Produk berhasil diperbarui!');
    }

    public function show($id)
    {
        // Ambil produk beserta variannya
        $item = Produk::with('varian')
            ->where('toko_id', Auth::user()->toko_id)
            ->findOrFail($id);

        // Siapkan data untuk Frontend
        $produkData = [
            'id' => $item->id,
            'nama_produk' => $item->nama_produk,
            'kategori' => $item->kategori,
            'satuan' => $item->satuan,
            'deskripsi' => $item->deskripsi,
            // Gambar Utama Parent
            'image_url' => $item->gambar_utama ? "/storage/{$item->gambar_utama}" : null,

            // LIST SEMUA VARIAN (Penting buat Switcher di Frontend)
            'varians' => $item->varian->map(function ($v) {
                return [
                    'id' => $v->id,
                    'nama_varian' => $v->nama_varian,
                    'stok' => $v->stok,
                    'harga_online' => $v->harga_online,
                    'harga_offline' => $v->harga_offline,
                    'sku' => $v->sku,
                    // Gambar Varian (jika ada), kalau null pakai default parent nanti di frontend
                    'gambar_url' => $v->gambar ? "/storage/{$v->gambar}" : null,
                ];
            }),
        ];

        return Inertia::render('Produk/Detail', [
            'produk' => $produkData
        ]);
    }
}
