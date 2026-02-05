import React, { useState } from 'react';
import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, router, usePage } from '@inertiajs/react';
import {
    MagnifyingGlassIcon,
    EyeIcon,
    XMarkIcon,
    ArrowPathIcon,
    PhotoIcon,
    FunnelIcon,
    ChevronDownIcon,
    CalendarIcon,
    BuildingStorefrontIcon,
    GlobeAsiaAustraliaIcon,
    DocumentArrowDownIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

// Helper Format Rupiah
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
};

// Helper Format Tanggal
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

// Component Badge Status
const PaymentBadge = ({ method }) => {
    const colors = {
        cash: 'bg-green-100 text-green-700 border-green-200',
        debit: 'bg-blue-100 text-blue-700 border-blue-200',
        qr: 'bg-purple-100 text-purple-700 border-purple-200',
        all: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${colors[method] || colors.all}`}>
            {method}
        </span>
    );
};

export default function Index({ transaksi, stats, filters, toko }) {
    const { auth } = usePage().props;
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

    const [filterValues, setFilterValues] = useState({
        channel: filters.channel || 'all',
        payment_method: filters.payment_method || 'all',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const handleFilter = (key, value) => {
        const newFilters = { ...filterValues, [key]: value };
        setFilterValues(newFilters);

        router.get(route('transaksi.index'), newFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const resetFilter = () => {
        setFilterValues({ channel: 'all', payment_method: 'all', start_date: '', end_date: '' });
        router.get(route('transaksi.index'), {}, { preserveState: true });
    };

    const handleExport = () => {
        // Build query params manual agar bisa buka tab baru/download langsung
        const params = new URLSearchParams({
            start_date: filterValues.start_date,
            end_date: filterValues.end_date,
            // Opsional: kirim filter lain jika controller mendukung filter saat export
            channel: filterValues.channel,
            payment_method: filterValues.payment_method
        }).toString();

        window.location.href = route('transaksi.export') + '?' + params;
    };

    const handleViewDetail = (item) => {
        setSelectedTrx(item);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <GeneralLayout header={<h2 className="font-bold text-xl md:text-2xl text-gray-800 px-1">Laporan Penjualan</h2>}>
            <Head title="Laporan Transaksi" />

            {/* --- CSS KHUSUS PRINT 80MM (FIXED BLANK PAGE) --- */}
            <style>{`
                /* Default: Sembunyikan Struk di Layar */
                #printable-receipt { display: none; }

                @media print {
                    /* 1. Sembunyikan SEMUA elemen root/body */
                    body * {
                        visibility: hidden;
                    }

                    /* 2. Reset Body & HTML agar tidak memotong konten */
                    body, html {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        width: 100%;
                        overflow: visible !important;
                        background-color: white;
                    }

                    /* 3. Tampilkan & Paksa Struk Muncul */
                    #printable-receipt {
                        display: block !important; /* Paksa muncul */
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 80mm; /* Lebar kertas thermal */
                        margin: 0;
                        padding: 0;
                        background-color: white;
                        z-index: 9999;
                        border: none !important;
                        box-shadow: none !important;
                    }

                    /* 4. Pastikan isi struk visible */
                    #printable-receipt * {
                        visibility: visible;
                    }

                    /* 5. Konfigurasi Halaman Printer */
                    @page {
                        size: 80mm auto;
                        margin: 0mm;
                    }

                    /* 6. Sembunyikan elemen non-cetak */
                    .no-print {
                        display: none !important;
                    }
                }

                .hide-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="no-print">
                {/* --- 1. STATISTIK CARDS --- */}
                <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
                    <div className="relative overflow-hidden bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-gray-50 rounded-xl">
                                <BuildingStorefrontIcon className="w-6 h-6 text-gray-600" />
                            </div>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full uppercase tracking-wider">Offline</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium mb-1">Total Pendapatan</p>
                            <h3 className="text-lg md:text-2xl font-black text-gray-900 truncate">{formatRupiah(stats.total_offline)}</h3>
                        </div>
                        <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity"><BuildingStorefrontIcon className="w-32 h-32 text-gray-900" /></div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-2xl shadow-lg shadow-blue-200 transition-all group text-white">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                <GlobeAsiaAustraliaIcon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-full uppercase tracking-wider">Online</span>
                        </div>
                        <div>
                            <p className="text-xs text-blue-100 font-medium mb-1">Total Pendapatan</p>
                            <h3 className="text-lg md:text-2xl font-black text-white truncate">{formatRupiah(stats.total_online)}</h3>
                        </div>
                        <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity"><GlobeAsiaAustraliaIcon className="w-32 h-32 text-white" /></div>
                    </div>
                </div>

                {/* --- 2. FILTER SECTION --- */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-4 md:mb-6 overflow-hidden">
                    <div className="p-4 flex justify-between items-center cursor-pointer md:cursor-default hover:bg-gray-50 transition-colors" onClick={() => setShowFilters(!showFilters)}>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-100 rounded-lg"><FunnelIcon className="w-4 h-4 text-gray-600" /></div>
                            <span className="font-bold text-sm text-gray-700">Filter Data</span>
                            {(filterValues.channel !== 'all' || filterValues.payment_method !== 'all' || filterValues.start_date) && (
                                <span className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">Aktif</span>
                            )}
                        </div>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 md:hidden ${showFilters ? 'rotate-180' : ''}`} />
                    </div>

                    <div className={`px-4 pb-4 md:pt-4 transition-all duration-300 ease-in-out ${showFilters ? 'block opacity-100' : 'hidden md:block opacity-0 md:opacity-100'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-2 border-t border-gray-50 md:border-0">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Channel</label>
                                <select value={filterValues.channel} onChange={(e) => handleFilter('channel', e.target.value)} className="w-full border-gray-200 rounded-xl text-sm font-medium focus:ring-black focus:border-black py-2.5 bg-gray-50/50">
                                    <option value="all">Semua Channel</option>
                                    <option value="offline">Offline Store</option>
                                    <option value="online">Online Store</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Pembayaran</label>
                                <select value={filterValues.payment_method} onChange={(e) => handleFilter('payment_method', e.target.value)} className="w-full border-gray-200 rounded-xl text-sm font-medium focus:ring-black focus:border-black py-2.5 bg-gray-50/50">
                                    <option value="all">Semua Metode</option>
                                    <option value="cash">Tunai (Cash)</option>
                                    <option value="debit">Debit Card</option>
                                    <option value="qr">QRIS</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Rentang Tanggal & Aksi</label>
                                <div className="flex gap-2 items-center">
                                    <input type="date" value={filterValues.start_date} onChange={(e) => handleFilter('start_date', e.target.value)} className="w-full border-gray-200 rounded-xl text-xs font-medium focus:ring-black focus:border-black py-2.5 bg-gray-50/50" />
                                    <span className="text-gray-300 font-bold">-</span>
                                    <input type="date" value={filterValues.end_date} onChange={(e) => handleFilter('end_date', e.target.value)} className="w-full border-gray-200 rounded-xl text-xs font-medium focus:ring-black focus:border-black py-2.5 bg-gray-50/50" />

                                    {/* Tombol Reset */}
                                    <button onClick={resetFilter} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors border border-gray-200" title="Reset Filter"><ArrowPathIcon className="w-5 h-5" /></button>

                                    {/* Tombol Export Excel */}
                                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95" title="Export Excel">
                                        <DocumentArrowDownIcon className="w-5 h-5" />
                                        <span className="hidden md:inline">Export</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 3. LIST TRANSAKSI --- */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                    {transaksi.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 p-6 text-center">
                            <div className="bg-gray-50 p-4 rounded-full mb-3"><MagnifyingGlassIcon className="w-8 h-8 opacity-50" /></div>
                            <p className="font-medium">Tidak ada transaksi ditemukan</p>
                            <p className="text-xs mt-1">Coba ubah filter pencarian Anda</p>
                        </div>
                    ) : (
                        <>
                            {/* --- DESKTOP TABLE --- */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Info Transaksi</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider">Metode</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Total</th>
                                            <th className="px-6 py-4 font-bold text-gray-500 uppercase text-xs tracking-wider text-center">Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {transaksi.data.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-1 h-8 rounded-full ${item.channel === 'online' ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">#{item.kode_transaksi || item.id}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {formatDate(item.tanggal)} • {item.user?.name || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><PaymentBadge method={item.metode_pembayaran} /></td>
                                                <td className="px-6 py-4 text-right"><span className="font-black text-gray-900">{formatRupiah(item.grand_total)}</span></td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleViewDetail(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><EyeIcon className="w-5 h-5" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* --- MOBILE CARD LIST --- */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {transaksi.data.map((item) => (
                                    <div key={item.id} className="p-4 active:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleViewDetail(item)}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-3">
                                                <div className={`w-1.5 self-stretch rounded-full ${item.channel === 'online' ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-900 text-sm">#{item.kode_transaksi || item.id}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.channel === 'online' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{item.channel}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {formatDate(item.tanggal)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-black text-gray-900 text-base">{formatRupiah(item.grand_total)}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-gray-50 pt-3 pl-4">
                                            <div className="flex items-center gap-1 text-xs text-gray-500"><span>Kasir:</span><span className="font-medium text-gray-700">{item.user?.name || '-'}</span></div>
                                            <PaymentBadge method={item.metode_pembayaran} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {transaksi.links.length > 3 && (
                        <div className="flex justify-center p-6 border-t border-gray-100 bg-gray-50/30">
                            <div className="flex gap-1 flex-wrap justify-center">
                                {transaksi.links.map((link, key) => (
                                    link.url ? (
                                        <button key={key} onClick={() => router.get(link.url, filterValues, { preserveState: true, preserveScroll: true })} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${link.active ? 'bg-black text-white shadow-md transform scale-105' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ) : (
                                        <span key={key} className="px-3 py-1.5 text-xs text-gray-300" dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL DETAIL TRANSAKSI (UI LAYAR SAJA) --- */}
            {selectedTrx && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 transition-all no-print" onClick={() => setSelectedTrx(null)}>
                    <div className="bg-white w-full md:max-w-lg md:rounded-3xl rounded-t-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-300 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="bg-white px-6 pb-4 pt-4 md:pt-6 border-b border-gray-100 flex justify-between items-start sticky top-0 z-10">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Detail Transaksi</p>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl font-black text-gray-900">#{selectedTrx.kode_transaksi || selectedTrx.id}</h3>
                                    <PaymentBadge method={selectedTrx.metode_pembayaran} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {formatDate(selectedTrx.tanggal)}</p>
                            </div>
                            <button onClick={() => setSelectedTrx(null)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"><XMarkIcon className="w-6 h-6" /></button>
                        </div>

                        {/* Modal Body: List Produk */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
                            <div className="space-y-4">
                                {selectedTrx.detail?.map((detail, index) => (
                                    <div key={index} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                                            {detail.produk?.gambar_utama ? (
                                                <img src={`/storage/${detail.produk.gambar_utama}`} alt={detail.produk.nama_produk} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                            ) : (
                                                <PhotoIcon className="w-6 h-6 text-gray-300" />
                                            )}
                                            <PhotoIcon className="w-6 h-6 text-gray-300 hidden" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight mb-1">{detail.produk?.nama_produk || 'Produk Dihapus'}</p>
                                            <div className="flex justify-between items-end">
                                                <p className="text-xs text-gray-500">{detail.qty} x <span className="font-medium">{formatRupiah(detail.harga_satuan)}</span></p>
                                                <p className="text-sm font-black text-gray-900">{formatRupiah(detail.subtotal)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer: Totals & Button */}
                        <div className="bg-white px-6 py-6 border-t border-gray-100 space-y-3 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-10 pb-8 md:pb-6">
                            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span className="font-bold text-gray-700">{formatRupiah(selectedTrx.total)}</span></div>
                            {Number(selectedTrx.diskon_nominal) > 0 && (
                                <div className="flex justify-between text-sm text-red-500"><span className="flex items-center gap-1">Diskon <span className="text-[10px] bg-red-100 px-1.5 rounded font-bold">HEMAT</span></span><span className="font-bold">- {formatRupiah(selectedTrx.diskon_nominal)}</span></div>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200">
                                <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">Grand Total</span>
                                <span className="text-2xl font-black text-gray-900">{formatRupiah(selectedTrx.grand_total)}</span>
                            </div>
                            <button onClick={handlePrint} className="w-full mt-2 py-3 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg active:scale-[0.98]">
                                <PrinterIcon className="w-5 h-5" /> Cetak Struk
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STRUK CETAK (HIDDEN SCREEN, VISIBLE PRINT) --- */}
            {/* PENTING: Jangan gunakan class 'hidden', gunakan CSS display:none di style tag atas */}
            {selectedTrx && (
                <div id="printable-receipt">
                    <div className="p-2">
                        {/* Header Struk dengan Logo */}
                        <div className="text-center mb-6">
                            <img src="/images/logo-houston.png" alt="Logo Houston" className="h-16 w-auto mx-auto mb-3 object-contain" />

                            <h2 className="font-bold text-lg text-gray-900 uppercase leading-tight">{toko?.nama_toko || auth.user.name}</h2>
                            {toko?.cabang && <p className="text-xs font-semibold text-gray-600 mt-0.5 uppercase">{toko.cabang}</p>}

                            <div className="text-[10px] text-gray-500 mt-2 space-y-0.5">
                                <p className="flex items-center justify-center gap-1 leading-tight">{toko?.alamat || 'Alamat Belum Diatur'}</p>
                                <p className="flex items-center justify-center gap-1 font-mono">
                                    No. Telp {toko?.no_telepon || toko?.no_hp || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-1 text-[10px] text-gray-600 font-mono">
                            <div className="flex justify-between"><span>NO. TRX</span><span className="font-bold text-gray-900 uppercase">{selectedTrx.kode_transaksi || selectedTrx.id}</span></div>
                            <div className="flex justify-between"><span>TANGGAL</span><span>{new Date(selectedTrx.tanggal).toLocaleDateString('id-ID')} {new Date(selectedTrx.tanggal).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span></div>
                            <div className="flex justify-between"><span>KASIR</span><span className="uppercase">{selectedTrx.user?.name || '-'}</span></div>
                            <div className="flex justify-between"><span>METODE</span><span className="uppercase font-bold">{selectedTrx.metode_pembayaran}</span></div>
                        </div>

                        {/* Items */}
                        <div className="space-y-3 mb-6">
                            {selectedTrx.detail?.map((item, idx) => (
                                <div key={idx} className="text-xs font-mono border-b border-gray-50 pb-2 last:border-0">
                                    <div className="flex justify-between font-bold text-gray-900">
                                        <span>
                                            {item.produk?.nama_produk}
                                            {/* Logic Varian di Struk */}
                                            {item.produk?.varian?.length > 1 && item.varian_id
                                                ? ` (${item.produk.varian.find(v => v.id === item.varian_id)?.nama_varian || ''})`
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 mt-0.5">
                                        <span>{item.qty} x {formatRupiah(item.harga_satuan)}</span>
                                        <span className="text-gray-900 font-bold">{formatRupiah(item.subtotal)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-300 pt-3 space-y-1 text-xs font-mono">
                            <div className="flex justify-between text-gray-600"><span>SUBTOTAL</span><span>{formatRupiah(selectedTrx.total)}</span></div>
                            {Number(selectedTrx.diskon_nominal) > 0 && <div className="flex justify-between text-red-600"><span>DISKON</span><span>-{formatRupiah(selectedTrx.diskon_nominal)}</span></div>}

                            <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-dashed border-gray-300 mt-2">
                                <span>TOTAL</span>
                                <span className="text-base">{formatRupiah(selectedTrx.grand_total)}</span>
                            </div>

                            <div className="flex justify-between text-gray-600 pt-1"><span>BAYAR</span><span>{formatRupiah(selectedTrx.grand_total)}</span></div>
                            <div className="flex justify-between text-gray-900 font-bold"><span>KEMBALI</span><span>{formatRupiah(0)}</span></div>
                        </div>

                        <div className="text-center mt-8 space-y-1">
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">*** TERIMA KASIH ***</p>
                            <p className="text-[8px] text-gray-400">Barang yang dibeli tidak dapat ditukar</p>
                        </div>
                    </div>
                </div>
            )}
        </GeneralLayout>
    );
}
