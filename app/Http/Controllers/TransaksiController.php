<?php

namespace App\Http\Controllers;
use App\Exports\LaporanKeuanganExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\Produk;
use App\Models\ProdukVarian;
use App\Models\Toko;
use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;

class TransaksiController extends Controller
{
    public function index(Request $request)
    {
        $tokoId = Auth::user()->toko_id;

        // Base Query untuk filter
        $query = Transaksi::query()->where('toko_id', $tokoId);

        // 1. Filter Channel
        if ($request->filled('channel') && $request->channel != 'all') {
            $query->where('channel', $request->channel);
        }

        // 2. Filter Metode Pembayaran
        if ($request->filled('payment_method') && $request->payment_method != 'all') {
            $query->where('metode_pembayaran', $request->payment_method);
        }

        // 3. Filter Tanggal Mulai
        if ($request->filled('start_date')) {
            $query->whereDate('tanggal', '>=', $request->start_date);
        }

        // 4. Filter Tanggal Akhir
        if ($request->filled('end_date')) {
            $query->whereDate('tanggal', '<=', $request->end_date);
        }

        // 5. Search by kode_transaksi
        if ($request->filled('search')) {
            $query->where('kode_transaksi', 'like', '%' . $request->search . '%');
        }

        // Clone untuk Stats (sebelum pagination & order)
        // Kita clone query yang SUDAH difilter agar stats mengikuti filter.
        // Jika user filter channel='online', maka stats offline otomatis 0 (karena query ada where channel='online' AND where channel='offline' -> empty)
        $stats = [
            'total_online' => (clone $query)->where('channel', 'online')->sum('grand_total'),
            'total_offline' => (clone $query)->where('channel', 'offline')->sum('grand_total'),
        ];

        // Ambil Data untuk List (tambah relation & order)
        $transaksi = $query->with(['user', 'detail.produk.varian', 'pembayaran'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $toko = Toko::find($tokoId);

        return Inertia::render('Transaksi/Index', [
            'transaksi' => $transaksi,
            'stats' => $stats,
            'toko' => $toko,
            'filters' => $request->only(['channel', 'start_date', 'end_date', 'search', 'payment_method'])
        ]);
    }

    public function export(Request $request)
    {
        $startDate = $request->start_date;
        $endDate = $request->end_date;

        $fileName = 'Laporan_Keuangan_' . ($startDate ?? 'Semua') . '_sd_' . ($endDate ?? 'Semua') . '.xlsx';

        return Excel::download(new LaporanKeuanganExport($startDate, $endDate), $fileName);
    }

    /**
     * Show the form for creating a new resource (POS Interface).
     */
    public function create()
    {
        $user = Auth::user();
        $tokoId = $user->toko_id;
        $toko = Toko::find($tokoId);

        // Ambil kategori untuk filter filtering
        $kategoris = Kategori::select('id', 'nama_kategori')->get();

        $produk = Produk::with(['varian', 'kategoriRelasi'])
            ->where('toko_id', $tokoId)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nama_produk' => $item->nama_produk,
                    // Pastikan ambil nama kategori dari relasi, fallback ke 'Umum' atau string lama
                    'kategori' => $item->kategoriRelasi ? $item->kategoriRelasi->nama_kategori : ($item->kategori ?? 'Umum'),
                    'gambar_utama' => $item->gambar_utama,
                    'is_variant' => $item->is_variant,
                    'variants' => $item->varian->map(function ($varian) {
                        return [
                            'id' => $varian->id,
                            'name' => $varian->nama_varian ?? 'Default',
                            'stok' => $varian->stok,
                            'gambar' => $varian->gambar,
                            'harga_online' => $varian->harga_online,
                            'harga_offline' => $varian->harga_offline,
                            'satuan' => $varian->satuan,
                        ];
                    }),
                    'stok' => $item->varian->first()->stok ?? 0,
                    'harga_online' => $item->varian->first()->harga_online ?? 0,
                    'harga_offline' => $item->varian->first()->harga_offline ?? 0,
                    'satuan' => $item->varian->first()->satuan ?? 'pcs',
                ];
            });

        return Inertia::render('Transaksi/Create', [
            'products' => $produk,
            'kategoris' => $kategoris,
            'toko' => $toko,
            'user' => $user,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'required|exists:produk,id',
            'cart.*.qty' => 'required|integer|min:1',
            'channel' => 'required|in:online,offline',
            'paymentMethod' => 'required|in:cash,debit,qr,split', // Support split
            'payments' => 'nullable|array', // Array of {method, nominal}
            'payments.*.method' => 'required_with:payments|in:cash,debit,qr',
            'payments.*.nominal' => 'required_with:payments|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'customerMoney' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            $tokoId = Auth::user()->toko_id;
            $userId = Auth::id();
            $total = 0;
            $cartItems = [];

            // 1. Validasi Stok & Hitung Subtotal
            foreach ($request->cart as $item) {
                // Ensure front-end sends 'variantId' or 'varian_id'
                $varianIdInCart = $item['variantId'] ?? $item['varian_id'] ?? null; 

                if ($varianIdInCart) {
                    $varian = ProdukVarian::with('produk')->find($varianIdInCart);
                } else {
                    // Fallback: ambil varian pertama (jika produk non-varian tapi struktur DB pake varian)
                    $varian = ProdukVarian::with('produk')->where('produk_id', $item['id'])->first();
                }

                if (!$varian) {
                    throw new \Exception("Produk tidak valid (ID: {$item['id']})");
                }

                if ($varian->stok < $item['qty']) {
                    throw new \Exception("Stok '{$varian->produk->nama_produk}' kurang. Sisa: {$varian->stok}");
                }

                // Cek flag bonus
                $isBonus = $item['is_bonus'] ?? false;
                $harga = $isBonus ? 0 : ($request->channel === 'online' ? $varian->harga_online : $varian->harga_offline);
                
                $subtotalHitung = $harga * $item['qty'];
                $total += $subtotalHitung;

                $cartItems[] = [
                    'produk_id' => $item['id'],
                    'varian_id' => $varian->id,
                    'qty' => $item['qty'],
                    'harga_satuan' => $harga,
                    'subtotal' => $subtotalHitung,
                    'varian_obj' => $varian
                ];
            }

            // 2. Hitung Grand Total
            $diskon = $request->discount ?? 0;
            $grandTotal = max(0, $total - $diskon);

            // 3. Validasi Pembayaran
            $paymentsToSave = [];
            $totalPaid = 0;
            $change = 0;

            if ($request->paymentMethod === 'split') {
                if (empty($request->payments)) {
                    throw new \Exception("Metode split memerlukan rincian pembayaran.");
                }

                foreach ($request->payments as $p) {
                    $nominal = (float) $p['nominal'];
                    if ($nominal > 0) {
                        $paymentsToSave[] = [
                            'metode_pembayaran' => $p['method'],
                            'nominal' => $nominal,
                            'keterangan' => $p['keterangan'] ?? null
                        ];
                        $totalPaid += $nominal;
                    }
                }

                if ($totalPaid < $grandTotal) {
                     throw new \Exception("Total pembayaran kurang Rp " . number_format($grandTotal - $totalPaid));
                }
                
                // Kembalian (asumsi kembalian tunai jika ada kelebihan)
                $change = max(0, $totalPaid - $grandTotal);

            } else {
                // Single Payment (Cash / Debit / QR)
                $nominalBayar = ($request->paymentMethod === 'cash') ? ($request->customerMoney ?? 0) : $grandTotal;
                
                if ($request->paymentMethod === 'cash' && $nominalBayar < $grandTotal) {
                     throw new \Exception("Uang pembayaran kurang Rp " . number_format($grandTotal - $nominalBayar));
                }

                $totalPaid = $nominalBayar;
                $change = max(0, $totalPaid - $grandTotal);

                // Entry tunggal untuk keseragaman data di tabel transaksi_pembayaran?
                // Opsional: kita simpan juga di tabel pembayaran agar konsisten
                $paymentsToSave[] = [
                    'metode_pembayaran' => $request->paymentMethod,
                    'nominal' => $totalPaid, // Simpan total yang diberi customer
                    'keterangan' => 'Single Payment'
                ];
            }

            // 4. Generate Kode Transaksi Unik
            // Format: TRX-YYYYMMDDHHMMSS-RANDOM
            $kodeUnik = 'TRX-' . now()->format('YmdHis') . '-' . rand(100, 999);

            // 5. Simpan Header Transaksi
            $transaksi = Transaksi::create([
                'toko_id' => $tokoId,
                'user_id' => $userId,
                'kode_transaksi' => $kodeUnik, 
                'channel' => $request->channel,
                'metode_pembayaran' => $request->paymentMethod,
                'total' => $total,
                'diskon_nominal' => $diskon,
                'grand_total' => $grandTotal,
                'tanggal' => now(),
            ]);

            // 6. Simpan Detail & Kurangi Stok
            foreach ($cartItems as $item) {
                TransaksiDetail::create([
                    'transaksi_id' => $transaksi->id,
                    'produk_id' => $item['produk_id'],
                    'qty' => $item['qty'],
                    'harga_satuan' => $item['harga_satuan'],
                    'subtotal' => $item['subtotal'],
                ]);

                $item['varian_obj']->decrement('stok', $item['qty']);
            }

            // 7. Simpan Riwayat Pembayaran
            foreach ($paymentsToSave as $pay) {
                \App\Models\TransaksiPembayaran::create([
                    'transaksi_id' => $transaksi->id,
                    'metode_pembayaran' => $pay['metode_pembayaran'],
                    'nominal' => $pay['nominal'],
                    'keterangan' => $pay['keterangan'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil!',
                'kode_transaksi' => $kodeUnik, // Kirim balik ke frontend untuk struk
                'grand_total' => $grandTotal,
                'change' => $change
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            // Return 422 agar frontend menangkap sebagai error validasi/logic
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function show($kode_transaksi)
    {
        $transaksi = Transaksi::with(['user', 'toko', 'detail.produk.varian', 'pembayaran'])
            ->where('kode_transaksi', $kode_transaksi)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ]);
    }

    public function edit(Transaksi $transaksi)
    {
        if ($transaksi->toko_id !== Auth::user()->toko_id) abort(403);
        
        $transaksi->load(['detail.produk.varian', 'pembayaran']);

        // Persiapkan data produk seperti di method create
        $user = Auth::user();
        $tokoId = $user->toko_id;
        $toko = Toko::find($tokoId);

        // Ambil kategori untuk filter filtering
        $kategoris = Kategori::select('id', 'nama_kategori')->get();

        $produk = Produk::with(['varian', 'kategoriRelasi'])
            ->where('toko_id', $tokoId)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nama_produk' => $item->nama_produk,
                    // Pastikan ambil nama kategori dari relasi atau fallback
                    'kategori' => $item->kategoriRelasi ? $item->kategoriRelasi->nama_kategori : ($item->kategori ?? 'Umum'),
                    'gambar_utama' => $item->gambar_utama,
                    'is_variant' => $item->is_variant,
                    'variants' => $item->varian->map(function ($varian) {
                        return [
                            'id' => $varian->id,
                            'name' => $varian->nama_varian ?? 'Default',
                            'stok' => $varian->stok,
                            'gambar' => $varian->gambar,
                            'harga_online' => $varian->harga_online,
                            'harga_offline' => $varian->harga_offline,
                            'satuan' => $varian->satuan,
                        ];
                    }),
                    'stok' => $item->varian->first()->stok ?? 0,
                    'harga_online' => $item->varian->first()->harga_online ?? 0,
                    'harga_offline' => $item->varian->first()->harga_offline ?? 0,
                    'satuan' => $item->varian->first()->satuan ?? 'pcs',
                ];
            });

        return Inertia::render('Transaksi/Edit', [
            'transaksi' => $transaksi,
            'products' => $produk,
            'kategoris' => $kategoris,
            'toko' => $toko,
            'user' => $user,
        ]);
    }

    public function update(Request $request, Transaksi $transaksi)
    {
        if ($transaksi->toko_id !== Auth::user()->toko_id) abort(403);

        $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'required|exists:produk,id',
            'cart.*.qty' => 'required|integer|min:1',
            'channel' => 'required|in:online,offline',
            'paymentMethod' => 'required|in:cash,debit,qr,split',
            'payments' => 'nullable|array',
            'payments.*.method' => 'required_with:payments|in:cash,debit,qr',
            'payments.*.nominal' => 'required_with:payments|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'customerMoney' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();

        try {
            // 1. REVERT OLD STOCK & DELETE DETAILS
            // 1. REVERT OLD STOCK & DELETE DETAILS
            foreach ($transaksi->detail as $detail) {
                // Prioritize varian_id if available (New Feature)
                if ($detail->varian_id) {
                    $varian = ProdukVarian::find($detail->varian_id);
                } else {
                    // Fallback to product_id (Old Data)
                    $varian = ProdukVarian::where('produk_id', $detail->produk_id)->first();
                }

                if ($varian) {
                    $varian->increment('stok', $detail->qty);
                }
            }
            
            $transaksi->detail()->delete();
            $transaksi->pembayaran()->delete();
            
            // 2. RE-APPLY NEW LOGIC (COPY FROM STORE METHOD)
            $total = 0;
            $cartItems = [];

            foreach ($request->cart as $item) {
                // Ensure front-end sends 'variantId' or 'varian_id'
                $varianIdInCart = $item['variantId'] ?? $item['varian_id'] ?? null; 

                if ($varianIdInCart) {
                    $varian = ProdukVarian::with('produk')->find($varianIdInCart);
                } else {
                    $varian = ProdukVarian::with('produk')->where('produk_id', $item['id'])->first();
                }

                if (!$varian) {
                    throw new \Exception("Produk tidak valid (ID: {$item['id']})");
                }

                if ($varian->stok < $item['qty']) {
                    throw new \Exception("Stok '{$varian->produk->nama_produk}' kurang. Sisa: {$varian->stok}");
                }

                $isBonus = $item['is_bonus'] ?? false;
                $harga = $isBonus ? 0 : ($request->channel === 'online' ? $varian->harga_online : $varian->harga_offline);
                
                $subtotalHitung = $harga * $item['qty'];
                $total += $subtotalHitung;

                $cartItems[] = [
                    'produk_id' => $item['id'],
                    'varian_id' => $varian->id,
                    'qty' => $item['qty'],
                    'harga_satuan' => $harga,
                    'subtotal' => $subtotalHitung,
                    'varian_obj' => $varian
                ];
            }

            $diskon = $request->discount ?? 0;
            $grandTotal = max(0, $total - $diskon);

            // Validasi Pembayaran (Copy logic store)
            $paymentsToSave = [];
            $totalPaid = 0;
            $change = 0;

            if ($request->paymentMethod === 'split') {
                if (empty($request->payments)) throw new \Exception("Metode split memerlukan rincian pembayaran.");
                foreach ($request->payments as $p) {
                    $nominal = (float) $p['nominal'];
                    if ($nominal > 0) {
                        $paymentsToSave[] = [
                            'metode_pembayaran' => $p['method'],
                            'nominal' => $nominal,
                            'keterangan' => $p['keterangan'] ?? null
                        ];
                        $totalPaid += $nominal;
                    }
                }
                if ($totalPaid < $grandTotal) throw new \Exception("Total pembayaran kurang Rp " . number_format($grandTotal - $totalPaid));
                $change = max(0, $totalPaid - $grandTotal);
            } else {
                $nominalBayar = ($request->paymentMethod === 'cash') ? ($request->customerMoney ?? 0) : $grandTotal;
                if ($request->paymentMethod === 'cash' && $nominalBayar < $grandTotal) {
                     throw new \Exception("Uang pembayaran kurang Rp " . number_format($grandTotal - $nominalBayar));
                }
                $totalPaid = $nominalBayar;
                $change = max(0, $totalPaid - $grandTotal);
                $paymentsToSave[] = [
                    'metode_pembayaran' => $request->paymentMethod,
                    'nominal' => $totalPaid,
                    'keterangan' => 'Single Payment'
                ];
            }

            // Update Header
            $transaksi->update([
                'channel' => $request->channel,
                'metode_pembayaran' => $request->paymentMethod,
                'total' => $total,
                'diskon_nominal' => $diskon,
                'grand_total' => $grandTotal,
            ]);

            // Save Detail & Update Stock
            foreach ($cartItems as $item) {
                TransaksiDetail::create([
                    'transaksi_id' => $transaksi->id,
                    'produk_id' => $item['produk_id'],
                    'varian_id' => $item['varian_id'], // Add varian_id
                    'qty' => $item['qty'],
                    'harga_satuan' => $item['harga_satuan'],
                    'subtotal' => $item['subtotal'],
                ]);
                $item['varian_obj']->decrement('stok', $item['qty']);
            }

            // Save Payments
            foreach ($paymentsToSave as $pay) {
                \App\Models\TransaksiPembayaran::create([
                    'transaksi_id' => $transaksi->id,
                    'metode_pembayaran' => $pay['metode_pembayaran'],
                    'nominal' => $pay['nominal'],
                    'keterangan' => $pay['keterangan'] ?? null,
                ]);
            }

            DB::commit();

            return redirect()->route('transaksi.index')->with('success', 'Transaksi berhasil diperbarui!');

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function destroy(Transaksi $transaksi)
    {
        if ($transaksi->toko_id !== Auth::user()->toko_id)
            abort(403);
        DB::beginTransaction();
        try {
            foreach ($transaksi->detail as $detail) {
                if ($detail->varian_id) {
                    $varian = ProdukVarian::find($detail->varian_id);
                } else {
                    $varian = ProdukVarian::where('produk_id', $detail->produk_id)->first();
                }

                if ($varian)
                    $varian->increment('stok', $detail->qty);
            }
            $transaksi->detail()->delete(); // Hapus detail dulu
            $transaksi->pembayaran()->delete(); // Hapus pembayaran dulu
            $transaksi->delete();
            DB::commit();
            return redirect()->back()->with('success', 'Transaksi dihapus');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal hapus: ' . $e->getMessage());
        }
    }
}
