import React, { useState, useEffect } from 'react';
import Select from 'react-select';
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
    PrinterIcon,
    PencilSquareIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import Swal from 'sweetalert2';

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
        split: 'bg-orange-100 text-orange-700 border-orange-200',
        all: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${colors[method] || colors.all}`}>
            {method}
        </span>
    );
};

export default function Index({ transaksi, stats, filters, toko }) {
    const { auth, flash } = usePage().props;
    const [selectedTrx, setSelectedTrx] = useState(null);

    // Initial Flash Check
    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: flash.success,
                showConfirmButton: false,
                timer: 1500
            });
        }
        if (flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: flash.error,
            });
        }
    }, [flash]);
    const [showFilters, setShowFilters] = useState(false);
    const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

    const [filterValues, setFilterValues] = useState({
        channel: filters.channel || 'all',
        payment_method: filters.payment_method || 'all',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
        search: filters.search || ''
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
        setFilterValues({ channel: 'all', payment_method: 'all', start_date: '', end_date: '', search: '' });
        router.get(route('transaksi.index'), {}, { preserveState: true });
    };

    const handleExport = () => {
        // Build query params manual agar bisa buka tab baru/download langsung
        // Gunakan filters prop agar selalu sync dengan URL (termasuk search)
        const params = new URLSearchParams({
            start_date: filters.start_date || '',
            end_date: filters.end_date || '',
            channel: filters.channel || 'all',
            payment_method: filters.payment_method || 'all',
            search: filters.search || ''
        }).toString();

        window.location.href = route('transaksi.export') + '?' + params;
    };

    const handleViewDetail = (item) => {
        setSelectedTrx(item);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Apakah Anda yakin?',
            text: "Transaksi yang dihapus akan mengembalikan stok produk!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#000000',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('transaksi.destroy', id), {
                    preserveScroll: true,
                    onSuccess: () => Swal.fire('Terhapus!', 'Transaksi berhasil dihapus.', 'success'),
                    onError: () => Swal.fire('Gagal!', 'Terjadi kesalahan saat menghapus.', 'error')
                });
            }
        });
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2 border-t border-gray-50 md:border-0">
                            <div className="space-y-1.5 z-20">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Channel</label>
                                <Select
                                    options={[
                                        { value: 'all', label: 'Semua Channel' },
                                        { value: 'offline', label: 'Offline Store' },
                                        { value: 'online', label: 'Online Store' }
                                    ]}
                                    value={[
                                        { value: 'all', label: 'Semua Channel' },
                                        { value: 'offline', label: 'Offline Store' },
                                        { value: 'online', label: 'Online Store' }
                                    ].find(opt => opt.value === filterValues.channel)}
                                    onChange={(option) => handleFilter('channel', option.value)}
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            borderRadius: '0.75rem',
                                            borderColor: state.isFocused ? '#e5e7eb' : '#e5e7eb',
                                            paddingTop: '2px',
                                            paddingBottom: '2px',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                borderColor: '#e5e7eb'
                                            }
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            zIndex: 9999,
                                            borderRadius: '0.75rem',
                                            overflow: 'hidden',
                                            marginTop: '4px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isSelected ? '#f3f4f6' : (state.isFocused ? '#f9fafb' : 'white'),
                                            color: state.isSelected ? '#111827' : '#374151',
                                            fontWeight: state.isSelected ? 600 : 400,
                                            cursor: 'pointer',
                                            fontSize: '0.875rem',
                                            ':active': {
                                                backgroundColor: '#e5e7eb'
                                            }
                                        }),
                                        input: (base) => ({
                                            ...base,
                                            boxShadow: 'none !important',
                                            outline: 'none !important',
                                            border: 'none !important',
                                            'input:focus': {
                                                boxShadow: 'none !important',
                                            }
                                        }),
                                        dropdownIndicator: (base, state) => ({
                                            ...base,
                                            transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s ease-in-out',
                                            color: '#9ca3af'
                                        }),
                                        indicatorSeparator: () => ({ display: 'none' })
                                    }}
                                    className="text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1.5 z-10">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Pembayaran</label>
                                <select value={filterValues.payment_method} onChange={(e) => handleFilter('payment_method', e.target.value)} className="w-full border-gray-200 rounded-xl text-sm font-medium focus:ring-black focus:border-black py-2.5 bg-gray-50/50">
                                    <option value="all">Semua Metode</option>
                                    <option value="cash">Tunai (Cash)</option>
                                    <option value="debit">Debit Card</option>
                                    <option value="qr">QRIS</option>
                                    <option value="split">Split Payment</option>
                                </select>
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Rentang Tanggal & Aksi</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {/* Wrapper Input Tanggal + Reset */}
                                    <div className="flex items-center gap-2 flex-1 w-full">
                                        <input type="date" value={filterValues.start_date} onChange={(e) => handleFilter('start_date', e.target.value)} className="w-full border-gray-200 rounded-xl text-xs font-medium focus:border-gray-300 focus:ring-0 py-2.5 bg-gray-50/50" />
                                        <span className="text-gray-300 font-bold">-</span>
                                        <input type="date" value={filterValues.end_date} onChange={(e) => handleFilter('end_date', e.target.value)} className="w-full border-gray-200 rounded-xl text-xs font-medium focus:ring-black focus:border-black py-2.5 bg-gray-50/50" />

                                        {/* Tombol Reset (Moved here) */}
                                        <button onClick={resetFilter} className="shrink-0 p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors border border-gray-200" title="Reset Filter">
                                            <ArrowPathIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Wrapper Tombol Export */}
                                    <div className="flex gap-2 shrink-0">
                                        {/* Tombol Export Excel */}
                                        <button onClick={handleExport} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95" title="Export Excel">
                                            <DocumentArrowDownIcon className="w-5 h-5" />
                                            <span>Export</span>
                                        </button>
                                    </div>
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
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleViewDetail(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Lihat Detail"><EyeIcon className="w-5 h-5" /></button>
                                                        <button onClick={() => router.get(route('transaksi.edit', item.id))} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all" title="Edit Transaksi"><PencilSquareIcon className="w-5 h-5" /></button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Hapus Transaksi"><TrashIcon className="w-5 h-5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* --- MOBILE CARD LIST --- */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {transaksi.data.map((item) => (
                                    <div key={item.id} className="p-4 active:bg-gray-50 transition-colors cursor-pointer group" onClick={() => handleViewDetail(item)}>
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
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-xs text-gray-500"><span>Kasir:</span><span className="font-medium text-gray-700">{item.user?.name || '-'}</span></div>
                                                <PaymentBadge method={item.metode_pembayaran} />
                                            </div>

                                            {/* Mobile Actions */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); router.get(route('transaksi.edit', item.id)); }}
                                                    className="p-2 text-white bg-orange-500 rounded-lg shadow-sm active:scale-95"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                    className="p-2 text-white bg-red-500 rounded-lg shadow-sm active:scale-95"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    <div className="flex flex-col md:flex-row justify-between items-center p-4 md:p-6 border-t border-gray-100 bg-gray-50/30 gap-4">
                        <div className="text-xs text-gray-500 font-medium">
                            Menampilkan <span className="font-bold text-gray-900">{transaksi.from || 0}</span> sampai <span className="font-bold text-gray-900">{transaksi.to || 0}</span> dari <span className="font-bold text-gray-900">{transaksi.total || 0}</span> transaksi
                        </div>

                        {transaksi.links && transaksi.links.length > 3 && (
                            <div className="flex gap-1 flex-wrap justify-center">
                                {transaksi.links.map((link, key) => (
                                    link.url ? (
                                        <button
                                            key={key}
                                            onClick={() => router.get(link.url, filterValues, { preserveState: true, preserveScroll: true })}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${link.active ? 'bg-black text-white shadow-md transform scale-105' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span
                                            key={key}
                                            className="px-3 py-1.5 text-xs text-gray-300 border border-transparent"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        )}
                    </div>
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
                                <div className="flex items-center gap-3">
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
                                {selectedTrx.detail?.map((detail, index) => {
                                    // Logic menentukan varian: Check varian_id first (New Logic), then fallback to price (Old Data)
                                    let variantName = '';
                                    const product = detail.produk;
                                    const isBonus = Number(detail.harga_satuan) === 0;
                                    let matchedVariant = null;

                                    if (product?.varian && product.varian.length > 0) {
                                        if (detail.varian_id) {
                                            // Exact match by ID (New Feature)
                                            matchedVariant = product.varian.find(v => v.id === detail.varian_id);
                                        }

                                        if (!matchedVariant) {
                                            // Fallback: Match by Price (Old Data)
                                            const channel = selectedTrx.channel;
                                            matchedVariant = product.varian.find(v => {
                                                const price = channel === 'online' ? v.harga_online : v.harga_offline;
                                                return Number(price) === Number(detail.harga_satuan);
                                            });
                                        }

                                        if (matchedVariant) {
                                            variantName = `(${matchedVariant.nama_varian})`;
                                        }
                                    }

                                    // Logic Image: prioritize variant image, fallback to product image
                                    const imageSrc = matchedVariant?.gambar
                                        ? `/storage/${matchedVariant.gambar}`
                                        : (detail.produk?.gambar_utama ? `/storage/${detail.produk.gambar_utama}` : null);

                                    return (
                                        <div key={index} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                            <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                                                {imageSrc ? (
                                                    <img src={imageSrc} alt={detail.produk?.nama_produk} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                                ) : (
                                                    <PhotoIcon className="w-6 h-6 text-gray-300" />
                                                )}
                                                <PhotoIcon className="w-6 h-6 text-gray-300 hidden" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight">
                                                        {detail.produk?.nama_produk || 'Produk Dihapus'} <span className="text-gray-500 font-normal">{variantName}</span>
                                                    </p>
                                                    {isBonus && (
                                                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">
                                                            BONUS
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <p className="text-xs text-gray-500">{detail.qty} x <span className="font-medium">{formatRupiah(detail.harga_satuan)}</span></p>
                                                    <p className="text-sm font-black text-gray-900">{formatRupiah(detail.subtotal)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer: Totals & Details */}
                        <div className="bg-white px-6 py-6 border-t border-gray-100 space-y-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-10 pb-8 md:pb-6">
                            {/* Rincian Pembayaran Box for Split */}
                            {selectedTrx.metode_pembayaran === 'split' && selectedTrx.pembayaran && (
                                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 bg-orange-100 rounded-full"><FunnelIcon className="w-3 h-3 text-orange-600" /></div>
                                        <span className="text-xs font-bold text-orange-800 uppercase">Rincian Split Payment</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        {selectedTrx.pembayaran.map((p, i) => (
                                            <div key={i} className="flex justify-between text-xs">
                                                <span className="text-gray-600 uppercase flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-300"></span>
                                                    {p.metode_pembayaran}
                                                </span>
                                                <span className="font-bold text-gray-800">{formatRupiah(p.nominal)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span className="font-bold text-gray-700">{formatRupiah(selectedTrx.total)}</span></div>
                                {Number(selectedTrx.diskon_nominal) > 0 && (
                                    <div className="flex justify-between text-sm text-red-500"><span className="flex items-center gap-1">Diskon <span className="text-[10px] bg-red-100 px-1.5 rounded font-bold">HEMAT</span></span><span className="font-bold">- {formatRupiah(selectedTrx.diskon_nominal)}</span></div>
                                )}
                                <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200">
                                    <span className="text-sm font-bold text-gray-900 uppercase tracking-widest">Grand Total</span>
                                    <span className="text-2xl font-black text-gray-900">{formatRupiah(selectedTrx.grand_total)}</span>
                                </div>
                            </div>

                            <button onClick={handlePrint} className="w-full py-3.5 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg active:scale-[0.98]">
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
                            <div className="flex justify-between"><span>TANGGAL</span><span>{new Date(selectedTrx.tanggal).toLocaleDateString('id-ID')} {new Date(selectedTrx.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div>
                            <div className="flex justify-between"><span>KASIR</span><span className="uppercase">{selectedTrx.user?.name || '-'}</span></div>
                            <div className="flex justify-between"><span>METODE</span><span className="uppercase font-bold">{selectedTrx.metode_pembayaran}</span></div>
                            {selectedTrx.metode_pembayaran === 'split' && selectedTrx.pembayaran && (
                                <div className="mt-1 border-t border-dashed border-gray-200 pt-1">
                                    {selectedTrx.pembayaran.map((p, i) => (
                                        <div key={i} className="flex justify-between text-[9px]">
                                            <span className="uppercase">- {p.metode_pembayaran}</span>
                                            <span>{formatRupiah(p.nominal)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div className="space-y-3 mb-6">
                            {selectedTrx.detail?.map((item, idx) => (
                                <div key={idx} className="text-xs font-mono border-b border-gray-50 pb-2 last:border-0">
                                    <div className="flex justify-between font-bold text-gray-900">
                                        <span>
                                            {item.produk?.nama_produk}
                                            {/* Logic Varian di Struk (Match by ID then Price) */}
                                            {(() => {
                                                if (item.produk?.varian && item.produk.varian.length > 0) {
                                                    let matchedVariant = null;

                                                    // 1. Try match by ID
                                                    if (item.varian_id) {
                                                        matchedVariant = item.produk.varian.find(v => v.id === item.varian_id);
                                                    }

                                                    // 2. Fallback match by Price
                                                    if (!matchedVariant) {
                                                        const channel = selectedTrx.channel;
                                                        matchedVariant = item.produk.varian.find(v => {
                                                            const price = channel === 'online' ? v.harga_online : v.harga_offline;
                                                            return Number(price) === Number(item.harga_satuan);
                                                        });
                                                    }

                                                    if (matchedVariant) return ` (${matchedVariant.nama_varian})`;
                                                }
                                                return '';
                                            })()}
                                            {Number(item.harga_satuan) === 0 ? ' (BONUS)' : ''}
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
