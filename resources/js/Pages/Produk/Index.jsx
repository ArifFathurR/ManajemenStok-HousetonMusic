import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
    PlusIcon, MagnifyingGlassIcon, PhotoIcon, ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

export default function ProdukIndex({ produk }) {
    const { flash } = usePage().props;

    // 1. Notifikasi Sukses dari Controller
    useEffect(() => {
        if (flash?.success) {
            Swal.fire({
                title: 'Berhasil!',
                text: flash.success,
                icon: 'success',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
        }
    }, [flash]);

    // 2. Logic Sorting & Search Client-Side Sederhana
    const [localProduk, setLocalProduk] = useState(produk);
    const [sortOrder, setSortOrder] = useState('asc'); // asc = stok sedikit, desc = stok banyak
    const [searchQuery, setSearchQuery] = useState('');

    // Update local state saat props berubah
    useEffect(() => {
        setLocalProduk(produk);
    }, [produk]);

    // Effect untuk Sorting & Filtering
    useEffect(() => {
        let filtered = [...produk];

        // Filter Search
        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.kategori && item.kategori.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Sorting based on Stock
        filtered.sort((a, b) => {
            return sortOrder === 'asc' ? a.stok - b.stok : b.stok - a.stok;
        });

        setLocalProduk(filtered);
    }, [sortOrder, searchQuery, produk]);

    const toggleSort = () => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    // Format Rupiah
    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(number);

    return (
        <GeneralLayout>
            <Head title="Katalog Produk" />

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900">Product Catalog</h1>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Inventory sorted by: <span className="font-semibold text-indigo-600">{sortOrder === 'asc' ? 'Lowest Stock' : 'Highest Stock'}</span>
                    </p>
                </div>

                <div className="flex gap-2 sm:gap-3">
                    {/* Search Bar */}
                    <div className="relative group flex-1 md:flex-none">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search product..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full md:w-56 rounded-xl border-gray-200 bg-white py-2 sm:py-2.5 pl-9 sm:pl-10 pr-4 text-sm text-gray-900 focus:ring-indigo-500 transition-all focus:w-full md:focus:w-64"
                        />
                    </div>

                    {/* Sort Button */}
                    <button onClick={toggleSort} className={`inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 border rounded-xl text-sm font-medium transition shadow-sm shrink-0 ${sortOrder === 'asc' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                        <ArrowsUpDownIcon className="w-5 h-5 sm:mr-2" />
                        <span className="hidden sm:inline">{sortOrder === 'asc' ? 'Low Stock' : 'High Stock'}</span>
                    </button>

                    {/* Add Button */}
                    <Link href={route('produk.create')} className="inline-flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-900 rounded-xl text-sm font-medium text-white hover:bg-gray-800 transition shadow-lg shadow-gray-200 shrink-0">
                        <PlusIcon className="w-5 h-5 sm:mr-2" />
                        <span className="hidden sm:inline">Add</span>
                    </Link>
                </div>
            </div>

            {/* GRID PRODUK */}
            {localProduk.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                    {localProduk.map((item) => (
                        <Link href={route('produk.show', item.id)} key={item.id} className="group bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">

                            {/* IMAGE WRAPPER */}
                            <div className="aspect-square bg-gray-50 relative overflow-hidden flex items-center justify-center">
                                {item.gambar ? (
                                    <img src={`/storage/${item.gambar}`} alt={item.nama_produk} className="w-full h-full object-contain p-2 sm:p-4 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <PhotoIcon className="h-10 w-10 sm:h-16 sm:w-16 text-gray-300" />
                                )}

                                {/* === BADGE STOK & ALERT (UPDATED) === */}
                                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end gap-1">

                                    {/* 1. Badge Utama (Total Stok) */}
                                    <span className={`inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold border shadow-sm ${item.stok > 0 ? 'bg-white/90 backdrop-blur text-gray-700 border-gray-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.stok > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {item.stok > 0 ? `${item.stok} ${item.satuan || 'Pcs'}` : 'Habis'}
                                    </span>

                                    {/* 2. Alert "Varian Habis" (Muncul jika ada varian yg 0 tapi total stok > 0) */}
                                    {item.ada_varian_habis && item.stok > 0 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-orange-100 text-orange-700 border border-orange-200 shadow-sm animate-pulse">
                                            ⚠️ Varian Habis
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* PRODUCT INFO */}
                            <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between">
                                <div>
                                    <div className="text-[10px] sm:text-xs font-medium text-indigo-600 mb-0.5 sm:mb-1 truncate uppercase tracking-wide">{item.kategori || 'General'}</div>
                                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-relaxed group-hover:text-indigo-600 transition-colors">{item.nama_produk}</h3>
                                </div>

                                {/* Stock Bar Visual */}
                                <div className="mt-3 sm:mt-4">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[10px] text-gray-400">Stock Level</span>
                                        <span className={`text-[10px] font-semibold ${item.stok < 5 ? 'text-red-500' : 'text-gray-500'}`}>
                                            {item.stok === 0 ? 'Out of Stock' : (item.stok < 5 ? 'Low Stock' : 'Good')}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                                item.stok === 0 ? 'bg-gray-200' :
                                                item.stok < 5 ? 'bg-red-500' :
                                                item.stok < 15 ? 'bg-yellow-400' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${Math.min(item.stok * 5, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                // EMPTY STATE
                <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                        <MagnifyingGlassIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 font-medium">No products found</h3>
                    <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new product.</p>
                </div>
            )}
        </GeneralLayout>
    );
}
