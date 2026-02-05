import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    PlusIcon, MagnifyingGlassIcon, PhotoIcon, ArrowsUpDownIcon,
    EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon, ArchiveBoxIcon
} from '@heroicons/react/24/outline';

export default function ProdukIndex({ produk }) {
    const { flash } = usePage().props;

    // --- 1. Notification Handling ---
    useEffect(() => {
        if (flash?.success) {
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
            Toast.fire({ icon: 'success', title: flash.success });
        }
    }, [flash]);

    // --- 2. State Management ---
    const [localProduk, setLocalProduk] = useState(produk);
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' = Terendah, 'desc' = Terbanyak
    const [searchQuery, setSearchQuery] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);

    // --- 3. Filtering & Sorting Logic ---
    useEffect(() => {
        setLocalProduk(produk);
    }, [produk]);

    useEffect(() => {
        let filtered = [...produk];

        // Filter Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.nama_produk.toLowerCase().includes(lowerQuery) ||
                (item.kategori && item.kategori.toLowerCase().includes(lowerQuery))
            );
        }

        // Sorting Stok (Client Side)
        filtered.sort((a, b) => {
            return sortOrder === 'asc' ? a.stok - b.stok : b.stok - a.stok;
        });

        setLocalProduk(filtered);
    }, [sortOrder, searchQuery, produk]);

    // --- 4. Handlers ---
    const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    const toggleMenu = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    useEffect(() => {
        const closeMenu = (e) => {
            if (!e.target.closest('.menu-trigger')) setOpenMenuId(null);
        };
        document.addEventListener('click', closeMenu);
        return () => document.removeEventListener('click', closeMenu);
    }, []);

    const handleDelete = (e, id) => {
        e.preventDefault();
        setOpenMenuId(null);
        Swal.fire({
            title: 'Hapus Produk?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#111827',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('produk.destroy', id));
            }
        });
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    };

    return (
        <GeneralLayout>
            <Head title="Katalog Produk" />

            {/* === HEADER & ACTIONS (MODIFIKASI: SINGLE ROW DI MOBILE) === */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Katalog Produk</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Kelola stok dan harga produk Anda.
                    </p>
                </div>

                {/* Container Satu Baris: Flex Row, Gap kecil */}
                <div className="flex w-full md:w-auto gap-2">

                    {/* 1. Search Bar (Flexible Width) */}
                    <div className="relative group flex-1 min-w-0">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-xl border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm transition-all"
                        />
                    </div>

                    {/* 2. Tombol Filter Stok (Fixed Width) */}
                    {/* Menggunakan shrink-0 agar tidak tergencet */}
                    <button
                        onClick={toggleSort}
                        className={`shrink-0 inline-flex items-center justify-center px-3 sm:px-4 py-2.5 border rounded-xl text-sm font-medium transition-all shadow-sm ${
                            sortOrder === 'asc'
                            ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' // Style Stok Sedikit
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700' // Style Stok Banyak (Aktif)
                        }`}
                        title={sortOrder === 'asc' ? "Klik untuk urutkan stok terbanyak" : "Klik untuk urutkan stok terendah"}
                    >
                        <ArrowsUpDownIcon className="w-5 h-5 sm:mr-2" />
                        {/* Teks hanya muncul di Tablet/Desktop (sm ke atas) */}
                        <span className="hidden sm:inline">
                            {sortOrder === 'asc' ? 'Stok (Rendah)' : 'Stok (Banyak)'}
                        </span>
                    </button>

                    {/* 3. Tombol Tambah (Fixed Width) */}
                    <Link
                        href={route('produk.create')}
                        className="shrink-0 inline-flex items-center justify-center px-3 sm:px-5 py-2.5 bg-gray-900 border border-transparent rounded-xl text-sm font-semibold text-white hover:bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all shadow-lg shadow-gray-200"
                    >
                        <PlusIcon className="w-5 h-5 sm:mr-2" />
                        <span className="hidden sm:inline">Tambah</span>
                    </Link>
                </div>
            </div>

            {/* === PRODUCT GRID === */}
            {localProduk.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 gap-y-5 sm:gap-6">
                    {localProduk.map((item) => (
                        <div
                            key={item.id}
                            className="group relative flex flex-col bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-gray-200 transition-all duration-300 overflow-hidden"
                        >
                            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                                {item.gambar ? (
                                    <img
                                        src={`/storage/${item.gambar}`}
                                        alt={item.nama_produk}
                                        className="w-full h-full object-contain p-4 mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                                        <PhotoIcon className="h-16 w-16" />
                                    </div>
                                )}

                                {/* Badge Stok */}
                                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end gap-1 pointer-events-none">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold border shadow-sm backdrop-blur-md ${
                                        item.stok > 0
                                        ? 'bg-white/90 text-gray-700 border-gray-200'
                                        : 'bg-red-50/90 text-red-600 border-red-100'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.stok > 5 ? 'bg-green-500' : (item.stok > 0 ? 'bg-yellow-500' : 'bg-red-500')}`}></span>
                                        {item.stok > 0 ? `${item.stok} ${item.satuan}` : 'Habis'}
                                    </span>
                                </div>

                                {/* Menu Trigger */}
                                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20">
                                    <button
                                        onClick={(e) => toggleMenu(e, item.id)}
                                        className="menu-trigger p-1.5 rounded-lg bg-white/70 hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 hover:text-gray-900 backdrop-blur-sm transition-all shadow-sm"
                                    >
                                        <EllipsisHorizontalIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                    {openMenuId === item.id && (
                                        <div className="absolute left-0 mt-1 w-32 sm:w-36 bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-left overflow-hidden">
                                            <div className="py-1">
                                                <Link
                                                    href={route('produk.edit', item.id)}
                                                    className="group flex items-center px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                                >
                                                    <PencilSquareIcon className="mr-3 h-4 w-4 text-gray-400 group-hover:text-indigo-500" />
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={(e) => handleDelete(e, item.id)}
                                                    className="group flex w-full items-center px-4 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <TrashIcon className="mr-3 h-4 w-4 text-red-400 group-hover:text-red-600" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Link href={route('produk.show', item.id)} className="flex flex-col flex-1 p-3 sm:p-4 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 truncate max-w-full">
                                        {item.kategori}
                                    </span>
                                </div>

                                <h3
                                    className="text-xs sm:text-sm font-bold text-gray-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 break-words"
                                    title={item.nama_produk}
                                >
                                    {item.nama_produk}
                                </h3>

                                <div className="mt-auto border-t border-dashed border-gray-100 w-full pt-2">
                                    <p className="text-[10px] font-medium text-gray-400 mb-0.5">Harga</p>
                                    <div className="font-bold text-gray-900 w-full text-xs sm:text-sm">
                                        {formatRupiah(item.min_harga)}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                   <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <ArchiveBoxIcon className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Belum ada produk</h3>
                    <p className="text-gray-500 max-w-sm mt-1 mb-6">
                        {searchQuery
                            ? `Tidak ditemukan produk dengan kata kunci "${searchQuery}"`
                            : "Mulai tambahkan produk pertama Anda untuk mengisi katalog."}
                    </p>
                     <Link
                        href={route('produk.create')}
                        className="inline-flex items-center px-5 py-2.5 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Tambah Produk Baru
                    </Link>
                </div>
            )}
        </GeneralLayout>
    );
}
