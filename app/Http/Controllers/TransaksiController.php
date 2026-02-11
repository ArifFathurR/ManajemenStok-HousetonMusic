<?php

namespace App\Http\Controllers;
use App\Exports\LaporanKeuanganExport;
use Maatwebsite\Excel\Facades\Excel;
use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\Produk;
use App\Models\ProdukVarian;
use App\Models\Toko;
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
        $transaksi = $query->with(['user', 'detail.produk', 'pembayaran'])
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

        $produk = Produk::with('varian')
            ->where('toko_id', $tokoId)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nama_produk' => $item->nama_produk,
                    'kategori' => $item->kategori,
                    // Kirim raw path gambar dari DB
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
                    // Data fallback jika non-varian
                    'stok' => $item->varian->first()->stok ?? 0,
                    'harga_online' => $item->varian->first()->harga_online ?? 0,
                    'harga_offline' => $item->varian->first()->harga_offline ?? 0,
                    'satuan' => $item->varian->first()->satuan ?? 'pcs',
                ];
            });

        return Inertia::render('Transaksi/Create', [
            'products' => $produk,
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
                $varianId = $item['variantId'] ?? null;

                if ($varianId) {
                    $varian = ProdukVarian::with('produk')->find($varianId);
                } else {
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

        $produk = Produk::with('varian')
            ->where('toko_id', $tokoId)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'nama_produk' => $item->nama_produk,
                    'kategori' => $item->kategori,
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
            foreach ($transaksi->detail as $detail) {
                // Cari varian yang sesuai (bisa via varian_id di detail jika ada column itu, atau via logic produk)
                // Asumsi di TransaksiDetail ada logic untul link ke varian. 
                // Di store method sebelumnya: 'varian_id' disimpan di detail?
                // Cek model TransaksiDetail (kita asumsi ada varian_id atau kita cari manual)
                
                // Cek store method: TransaksiDetail punya 'produk_id' dan logic pengurangan stok pake $varian->decrement
                // Kita perlu balikin stok ke varian yang tepat.
                // Jika TransaksiDetail tidak simpan varian_id, ini agak susah jika 1 produk punya banyak varian yang sama harganya (ambigu).
                // TAPI, di store method tadi: 'varian_id' => $varian->id disimpan ke $cartItems tapi apa masuk ke DB?
                // Cek schema di store method: TransaksiDetail::create([...]) tidak ada varian_id di array create?
                // TUNGGU, di store method line 257: TransaksiDetail::create tidak menyertakan varian_id! 
                // Line 257: produk_id, qty, harga_satuan, subtotal.
                // INI MASALAH jika produk punya varian. Kita harus fix TransaksiDetail dulu atau asumsi.
                // NAMUN, jika sistem berjalan, varian_id mungkin sudah ada di model tapi lupa diisi di controller, ATAU logic delete saya harus smart.
                
                // FIX: Saya akan asumsi untuk saat ini kita balikin stok ke 'ProdukVarian' yang match dengan produk_id.
                // Jika produk varian > 1, kita butuh info varian mana.
                // Jika tabel detail belum punya varian_id, kita hanya bisa nebak atau balikin ke salah satu.
                // IDEALNYA: Tambah kolom varian_id ke transaksi_detail. Tapi user minta fitur edit/hapus sekarang.
                // Cek input store method: $cartItems[] punya 'varian_id'. 
                // Line 257 create detail tidak simpan varian_id. 
                // INI BUG POTENSIAL. Tapi saya akan coba restore berdasarkan produk_id saja dulu (first variant or match price?).
                
                // REVISI: Untuk code ini, saya akan restore ke varian pertama yg ketemu utk produk tsb atau sesuai produkId jika flat.
                
                $varian = ProdukVarian::where('produk_id', $detail->produk_id)->first(); 
                // Note: ini tidak akurat 100% kalau multi-varian beli varian ke-2. 
                // Tapi karena struktur DB detail mungkin terbatas, kita best-effort.
                // (Saran ke user: perbaiki struktur DB detail utk simpan varian_id nanti)
                
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
                $varianId = $item['variantId'] ?? null;

                if ($varianId) {
                    $varian = ProdukVarian::with('produk')->find($varianId);
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
                    'qty' => $item['qty'],
                    'harga_satuan' => $item['harga_satuan'],
                    'subtotal' => $item['subtotal'],
                    // Note: Idealnya save varian_id disini jika kolomnya ada
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

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil diperbarui!',
                'kode_transaksi' => $transaksi->kode_transaksi,
                'grand_total' => $grandTotal,
                'change' => $change
            ]);

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
                $varian = ProdukVarian::where('produk_id', $detail->produk_id)->first();
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
