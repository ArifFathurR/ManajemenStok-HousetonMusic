<?php

namespace App\Http\Controllers;

use App\Models\Transaksi;
use App\Models\TransaksiDetail;
use App\Models\Produk;
use App\Models\ProdukVarian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class TransaksiController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $tokoId = Auth::user()->toko_id;

        // Filter berdasarkan channel dan tanggal
        $query = Transaksi::with(['user', 'detail.produk'])
            ->where('toko_id', $tokoId)
            ->orderBy('created_at', 'desc');

        // 1. Filter Channel
        if ($request->filled('channel') && $request->channel != 'all') {
            $query->where('channel', $request->channel);
        }

        // 2. Filter Metode Pembayaran (BARU)
        if ($request->filled('payment_method') && $request->payment_method != 'all') {
            $query->where('metode_pembayaran', $request->payment_method);
        }

        // 3. Filter Tanggal
        if ($request->filled('start_date')) {
            $query->whereDate('tanggal', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('tanggal', '<=', $request->end_date);
        }

        $transaksi = $query->paginate(20);

        // Statistik (Sama seperti sebelumnya)
        $stats = [
            'total_online' => Transaksi::where('toko_id', $tokoId)
                ->where('channel', 'online')
                ->whereBetween('tanggal', [Carbon::now()->subDays(7), Carbon::now()])
                ->sum('grand_total'),
            'total_offline' => Transaksi::where('toko_id', $tokoId)
                ->where('channel', 'offline')
                ->whereBetween('tanggal', [Carbon::now()->subDays(7), Carbon::now()])
                ->sum('grand_total'),
        ];

        return Inertia::render('Transaksi/Index', [
            'transaksi' => $transaksi,
            'stats' => $stats,
            // Tambahkan payment_method ke props filters
            'filters' => $request->only(['channel', 'start_date', 'end_date', 'payment_method'])
        ]);
    }

    /**
     * Show the form for creating a new resource (POS Interface).
     */
    public function create()
    {
        $tokoId = Auth::user()->toko_id;

        // Ambil produk dengan varian
        $produk = Produk::with('varian')
            ->where('toko_id', $tokoId)
            ->get()
            ->map(function ($item) {
                // LOGIC FIX: Kirim raw path dari database, jangan diubah-ubah disini.
                // Menggunakan 'gambar_utama' sesuai referensi ProdukController Anda.

                return [
                    'id' => $item->id,
                    'nama_produk' => $item->nama_produk,
                    'kategori' => $item->kategori,

                    // Kirim path gambar apa adanya
                    'gambar_utama' => $item->gambar_utama,

                    'is_variant' => $item->is_variant,
                    'variants' => $item->varian->map(function ($varian) {
                        return [
                            'id' => $varian->id,
                            'name' => $varian->nama_varian ?? 'Default',
                            'stok' => $varian->stok,

                            // Kirim path gambar varian apa adanya
                            'gambar' => $varian->gambar,

                            'harga_online' => $varian->harga_online,
                            'harga_offline' => $varian->harga_offline,
                            'satuan' => $varian->satuan,
                        ];
                    }),
                    // Untuk produk tanpa varian, ambil data dari varian pertama
                    'stok' => $item->varian->first()->stok ?? 0,
                    'harga_online' => $item->varian->first()->harga_online ?? 0,
                    'harga_offline' => $item->varian->first()->harga_offline ?? 0,
                    'satuan' => $item->varian->first()->satuan ?? 'pcs',
                ];
            });

        return Inertia::render('Transaksi/Create', [
            'products' => $produk
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'cart' => 'required|array|min:1',
            'cart.*.id' => 'required|exists:produk,id',
            'cart.*.variantId' => 'nullable|exists:produk_varian,id',
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

            // Validasi stok dan hitung total
            foreach ($request->cart as $item) {
                $varianId = $item['variantId'] ?? null;

                // Cari varian
                if ($varianId) {
                    $varian = ProdukVarian::findOrFail($varianId);
                } else {
                    // Ambil varian default (pertama)
                    $varian = ProdukVarian::where('produk_id', $item['id'])->firstOrFail();
                }

                // Cek stok
                if ($varian->stok < $item['qty']) {
                    throw new \Exception("Stok {$varian->produk->nama_produk} tidak mencukupi. Tersedia: {$varian->stok}");
                }

                // Ambil harga sesuai channel
                $harga = $request->channel === 'online'
                    ? $varian->harga_online
                    : $varian->harga_offline;

                $subtotal = $harga * $item['qty'];
                $total += $subtotal;

                $cartItems[] = [
                    'produk_id' => $item['id'],
                    'varian_id' => $varian->id,
                    'qty' => $item['qty'],
                    'harga_satuan' => $harga,
                    'subtotal' => $subtotal,
                    'varian_obj' => $varian
                ];
            }

            // Hitung grand total
            $diskon = $request->discount ?? 0;
            $grandTotal = max(0, $total - $diskon);

            // Validasi pembayaran cash
            if ($request->paymentMethod === 'cash') {
                $customerMoney = $request->customerMoney ?? 0;
                if ($customerMoney < $grandTotal) {
                    throw new \Exception("Uang pembayaran tidak mencukupi");
                }
            }

            // Simpan transaksi
            $transaksi = Transaksi::create([
                'toko_id' => $tokoId,
                'user_id' => $userId,
                'channel' => $request->channel,
                'metode_pembayaran' => $request->paymentMethod,
                'total' => $total,
                'diskon_nominal' => $diskon,
                'grand_total' => $grandTotal,
                'tanggal' => now(),
            ]);

            // Simpan detail transaksi dan kurangi stok
            foreach ($cartItems as $item) {
                TransaksiDetail::create([
                    'transaksi_id' => $transaksi->id,
                    'produk_id' => $item['produk_id'],
                    'qty' => $item['qty'],
                    'harga_satuan' => $item['harga_satuan'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Kurangi stok
                $item['varian_obj']->decrement('stok', $item['qty']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil disimpan',
                'transaksi_id' => $transaksi->id,
                'grand_total' => $grandTotal,
                'change' => $request->paymentMethod === 'cash'
                    ? max(0, ($request->customerMoney ?? 0) - $grandTotal)
                    : 0
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            // Log error untuk debugging
            Log::error('Transaction Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Transaksi $transaksi)
    {
        // Pastikan transaksi milik toko user
        if ($transaksi->toko_id !== Auth::user()->toko_id) {
            abort(403);
        }

        DB::beginTransaction();

        try {
            // Kembalikan stok
            foreach ($transaksi->detail as $detail) {
                $varian = ProdukVarian::where('produk_id', $detail->produk_id)->first();
                if ($varian) {
                    $varian->increment('stok', $detail->qty);
                }
            }

            $transaksi->delete();
            DB::commit();

            return redirect()->back()->with('success', 'Transaksi berhasil dihapus');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal menghapus transaksi');
        }
    }
}
