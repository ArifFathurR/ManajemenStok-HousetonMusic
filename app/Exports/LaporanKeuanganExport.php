<?php

namespace App\Exports;

use App\Models\Transaksi;
use App\Models\Produk;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\Auth;

class LaporanKeuanganExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithEvents
{
    protected $startDate;
    protected $endDate;
    protected $tokoId;
    protected $categories;

    public function __construct($startDate, $endDate)
    {
        $this->startDate = $startDate ? Carbon::parse($startDate) : Carbon::now()->startOfMonth();
        $this->endDate = $endDate ? Carbon::parse($endDate) : Carbon::now()->endOfMonth();
        $this->tokoId = Auth::user()->toko_id;

        // Ambil Kategori dari Database
        $this->categories = Produk::where('toko_id', $this->tokoId)
            ->whereNotNull('kategori')
            ->where('kategori', '!=', '')
            ->distinct()
            ->orderBy('kategori', 'ASC')
            ->pluck('kategori')
            ->toArray();
    }

    public function collection()
    {
        $period = CarbonPeriod::create($this->startDate, $this->endDate);
        $data = [];

        $transactions = Transaksi::with(['detail.produk'])
            ->where('toko_id', $this->tokoId)
            ->whereDate('tanggal', '>=', $this->startDate)
            ->whereDate('tanggal', '<=', $this->endDate)
            ->get();

        foreach ($period as $date) {
            $currentDate = $date->format('Y-m-d');
            
            // Filter transaksi hari ini
            $dailyTrx = $transactions->filter(function ($trx) use ($currentDate) {
                return $trx->tanggal->format('Y-m-d') === $currentDate;
            });

            // Kolom 1: Tanggal
            $row = [$currentDate];

            $dailyTotalQty = 0;
            $dailyTotalNet = 0; 
            $dailyTotalDiskon = 0;

            // --- LOOP PER KATEGORI ---
            foreach ($this->categories as $category) {
                $catQty = 0;
                $catNet = 0;        // Uang Bersih (Subtotal - Diskon)
                $catDiskonShare = 0; // Porsi Diskon

                foreach ($dailyTrx as $trx) {
                    $trxGrossTotal = $trx->detail->sum('subtotal');
                    $trxDiscount = $trx->diskon_nominal;

                    foreach ($trx->detail as $detail) {
                        if ($detail->produk && strcasecmp($detail->produk->kategori, $category) == 0) {
                            
                            // 1. Hitung Proporsi Diskon
                            $itemGross = $detail->subtotal; // Harga x Qty
                            
                            // (Harga Item / Total Nota) * Total Diskon Nota
                            $contribution = $trxGrossTotal > 0 ? ($itemGross / $trxGrossTotal) : 0;
                            $share = $contribution * $trxDiscount;

                            // 2. Hitung Net
                            $itemNet = $itemGross - $share;

                            // 3. Akumulasi ke Kategori
                            $catQty += $detail->qty;
                            $catNet += $itemNet;
                            $catDiskonShare += $share;
                        }
                    }
                }

                // Masukkan 3 Kolom per Kategori
                $row[] = $catQty == 0 ? '' : $catQty;
                $row[] = $catNet == 0 ? '' : $catNet;           // UANG (Net)
                $row[] = $catDiskonShare == 0 ? '' : $catDiskonShare; // DISKON (Potongan)

                // Akumulasi Total Harian
                $dailyTotalQty += $catQty;
                $dailyTotalNet += $catNet;
                $dailyTotalDiskon += $catDiskonShare;
            }

            // --- TOTAL BARANG (Kanan) ---
            $row[] = $dailyTotalQty;
            $row[] = $dailyTotalNet; 
            $row[] = $dailyTotalDiskon;

            // Spacer
            $row[] = ''; 
            $row[] = $currentDate;

            // Cash & Non Cash
            $cash = $dailyTrx->where('metode_pembayaran', 'cash')->sum('grand_total');
            $nonCash = $dailyTrx->whereIn('metode_pembayaran', ['debit', 'qr'])->sum('grand_total');

            $row[] = $cash;
            $row[] = $nonCash;
            $row[] = $cash + $nonCash; // Total Harian (Sama dengan Total Net Barang)

            $data[] = $row;
        }

        return collect($data);
    }

    public function headings(): array
    {
        $heading1 = ['LAPORAN KEUANGAN HARIAN DETAILED'];

        // --- Header Baris 2 (Nama Kategori) ---
        $heading2 = ['TANGGAL'];
        foreach ($this->categories as $category) {
            $heading2[] = strtoupper($category);
            $heading2[] = ''; // Spacer untuk Merge
            $heading2[] = ''; // Spacer untuk Merge
        }

        // Header Statis Kanan
        $heading2 = array_merge($heading2, [
            'TOTAL SEMUA', '', '', '', 'TANGGAL', 'CASH', 'NON CASH', 'TOTAL SETORAN'
        ]);

        // --- Header Baris 3 (QTY, UANG, DISKON) ---
        $heading3 = ['']; 
        foreach ($this->categories as $category) {
            $heading3[] = 'QTY';
            $heading3[] = 'UANG';
            $heading3[] = 'DISKON';
        }

        // Sub-header Statis Kanan
        $heading3 = array_merge($heading3, [
            'QTY', 'UANG', 'DISKON', '', '', 'RP', 'RP', 'RP'
        ]);

        return [$heading1, $heading2, $heading3];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 14], 'alignment' => ['horizontal' => 'center']],
            2 => ['font' => ['bold' => true], 'alignment' => ['horizontal' => 'center', 'vertical' => 'center']],
            3 => ['font' => ['bold' => true], 'alignment' => ['horizontal' => 'center']],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Hitung total kolom: (Jml Kategori * 3) + 1(Tgl) + 3(Total Kanan) + 1(Spacer) + 1(Tgl) + 3(Setoran)
                // = (Cat * 3) + 9
                $lastColumnIndex = count($this->categories) * 3 + 9;
                $lastColumn = Coordinate::stringFromColumnIndex($lastColumnIndex);

                // Merge Judul Utama
                $sheet->mergeCells("A1:{$lastColumn}1");
                $sheet->mergeCells('A2:A3'); // Tanggal Kiri

                // --- MERGE HEADER KATEGORI (3 Kolom per Kategori) ---
                $colIndex = 2; // Mulai dari Kolom B
                foreach ($this->categories as $cat) {
                    $startCol = Coordinate::stringFromColumnIndex($colIndex);
                    $endCol = Coordinate::stringFromColumnIndex($colIndex + 2); // Merge 3 Kolom
                    
                    $sheet->mergeCells("{$startCol}2:{$endCol}2");
                    $colIndex += 3; // Lompat 3 langkah
                }

                // --- MERGE HEADER 'TOTAL SEMUA' (3 Kolom) ---
                $startTotal = Coordinate::stringFromColumnIndex($colIndex);
                $endTotal = Coordinate::stringFromColumnIndex($colIndex + 2);
                $sheet->mergeCells("{$startTotal}2:{$endTotal}2");
                $colIndex += 3;

                // Style Border
                $highestRow = $sheet->getHighestRow();
                $styleArray = [
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                        ],
                    ],
                ];
                $sheet->getStyle("A2:{$lastColumn}{$highestRow}")->applyFromArray($styleArray);
            },
        ];
    }
}