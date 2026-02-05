<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use App\Models\ProdukVarian;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $tokoId = Auth::user()->toko_id;
        $now = Carbon::now();
        $lastMonth = Carbon::now()->subMonth();

        // 1. HITUNG PENDAPATAN & PERSENTASE
        $pendapatanBulanIni = Transaksi::where('toko_id', $tokoId)
            ->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year)->sum('grand_total');

        $pendapatanBulanLalu = Transaksi::where('toko_id', $tokoId)
            ->whereMonth('tanggal', $lastMonth->month)->whereYear('tanggal', $lastMonth->year)->sum('grand_total');

        $persenPendapatan = $this->hitungPersentase($pendapatanBulanIni, $pendapatanBulanLalu);

        // 2. HITUNG PRODUK BARU
        $totalProduk = Produk::where('toko_id', $tokoId)->count();

        $produkBaruBulanIni = Produk::where('toko_id', $tokoId)
            ->whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->count();

        // 3. HITUNG ITEM TERJUAL & PERSENTASE
        $terjualBulanIni = TransaksiDetail::whereHas('transaksi', fn($q) => $q->where('toko_id', $tokoId)
            ->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year))->sum('qty');

        $terjualBulanLalu = TransaksiDetail::whereHas('transaksi', fn($q) => $q->where('toko_id', $tokoId)
            ->whereMonth('tanggal', $lastMonth->month)->whereYear('tanggal', $lastMonth->year))->sum('qty');

        $persenTerjual = $this->hitungPersentase($terjualBulanIni, $terjualBulanLalu);

        // --- PERBAIKAN DI SINI (Total Kategori) ---
        // Menghitung jumlah kategori unik berdasarkan kategori_id yang dipakai produk
        $totalKategori = Produk::where('toko_id', $tokoId)
            ->whereNotNull('kategori_id') // Pastikan tidak null
            ->distinct('kategori_id')     // Ambil ID unik
            ->count('kategori_id');       // Hitung jumlahnya

        // 4. GRAFIK TREN
        $chartData = Transaksi::where('toko_id', $tokoId)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->selectRaw('DATE(tanggal) as date, SUM(grand_total) as total')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('d M'),
                    'total' => (float) $item->total
                ];
            });

        // 5. TOP 5 PRODUK
        $topProducts = TransaksiDetail::whereHas('transaksi', fn($q) => $q->where('toko_id', $tokoId)
                ->whereMonth('tanggal', $now->month)->whereYear('tanggal', $now->year))
            ->select('produk_id', DB::raw('SUM(qty) as total_sold'))
            ->groupBy('produk_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->with(['produk.kategoriRelasi']) // Load relasi Kategori
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->produk->id,
                    'name' => $item->produk->nama_produk,
                    // Ambil nama kategori dari relasi
                    'category' => $item->produk->kategoriRelasi ? $item->produk->kategoriRelasi->nama_kategori : 'Umum',
                    'sold' => $item->total_sold,
                    'image' => $item->produk->gambar_utama ? '/storage/' . $item->produk->gambar_utama : null
                ];
            });

        // 6. STOK MENIPIS
        $lowStockVariants = ProdukVarian::with('produk')
            ->whereHas('produk', fn($q) => $q->where('toko_id', $tokoId))
            ->where('stok', '<', 5)
            ->orderBy('stok', 'asc')
            ->limit(20)
            ->get()
            ->map(function ($variant) {
                return [
                    'id' => $variant->id,
                    'produk_id' => $variant->produk_id,
                    'parent_name' => $variant->produk->nama_produk,
                    'variant_name' => $variant->nama_varian,
                    'stok' => $variant->stok,
                    'image' => $variant->gambar ? '/storage/' . $variant->gambar : ($variant->produk->gambar_utama ? '/storage/' . $variant->produk->gambar_utama : null),
                    'satuan' => $variant->produk->satuan
                ];
            });

        // 7. INFO CHANNEL (Online vs Offline)
        $revenueByChannel = Transaksi::where('toko_id', $tokoId)
            ->whereMonth('tanggal', $now->month)
            ->whereYear('tanggal', $now->year)
            ->select('channel', DB::raw('SUM(grand_total) as total'))
            ->groupBy('channel')
            ->pluck('total', 'channel')
            ->toArray();

        return Inertia::render('Dashboard', [
            'stats' => [
                'pendapatan' => (float) $pendapatanBulanIni,
                'persen_pendapatan' => $persenPendapatan,
                'total_produk' => $totalProduk,
                'produk_baru' => $produkBaruBulanIni,
                'terjual' => (int) $terjualBulanIni,
                'persen_terjual' => $persenTerjual,
                'total_kategori' => $totalKategori,
            ],
            'chart_data' => $chartData,
            'top_products' => $topProducts,
            'low_stock_variants' => $lowStockVariants,
            'revenue_by_channel' => [
                'offline' => (float) ($revenueByChannel['offline'] ?? 0),
                'online' => (float) ($revenueByChannel['online'] ?? 0),
            ]
        ]);
    }

    private function hitungPersentase($current, $previous)
    {
        if ($previous > 0) {
            return round((($current - $previous) / $previous) * 100, 1);
        }
        return $current > 0 ? 100 : 0;
    }
}
