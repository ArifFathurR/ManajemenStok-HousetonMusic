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

        $query = Transaksi::with(['user', 'detail.produk'])
            ->where('toko_id', $tokoId)
            ->orderBy('created_at', 'desc');

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

        $transaksi = $query->paginate(20);

        $stats = [
            'total_online' => Transaksi::where('toko_id', $tokoId)->where('channel', 'online')->sum('grand_total'),
            'total_offline' => Transaksi::where('toko_id', $tokoId)->where('channel', 'offline')->sum('grand_total'),
        ];

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
            'paymentMethod' => 'required|in:cash,debit,qr',
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
            if ($request->paymentMethod === 'cash') {
                $customerMoney = $request->customerMoney ?? 0;
                if ($customerMoney < $grandTotal) {
                    throw new \Exception("Uang pembayaran kurang Rp " . number_format($grandTotal - $customerMoney));
                }
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

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil!',
                'kode_transaksi' => $kodeUnik, // Kirim balik ke frontend untuk struk
                'grand_total' => $grandTotal,
                'change' => $request->paymentMethod === 'cash' ? max(0, ($request->customerMoney ?? 0) - $grandTotal) : 0
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            // Return 422 agar frontend menangkap sebagai error validasi/logic
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function show($kode_transaksi)
    {
        $transaksi = Transaksi::with(['user', 'toko', 'detail.produk.varian'])
            ->where('kode_transaksi', $kode_transaksi)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $transaksi
        ]);
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
            $transaksi->delete();
            DB::commit();
            return redirect()->back()->with('success', 'Transaksi dihapus');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal hapus');
        }
    }
}
