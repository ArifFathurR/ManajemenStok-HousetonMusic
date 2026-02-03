import TestLayout from '@/Layouts/TestLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline';

export default function ProductDetail({ produk }) {
    const [selectedImage, setSelectedImage] = useState(0);

    const productData = produk || {
        id: 1,
        nama_produk: 'Apple AirPods Max (USB-C)',
        kategori: 'Accessories',
        stok: 25,
        satuan: 'Unit',
        harga_online: 8500000,
        harga_offline: 8250000,
        deskripsi: 'AirPods Max, the ultimate listening experience. Now available in five new colors. Apple-designed drivers deliver high-fidelity audio. Every detail, from the canopy to the cushions, has been conceived with incredible precision in mind.',
        status: 'Published',
        image_url: 'https://images.unsplash.com/photo-1625298378605-0ff5a3d13f0d?w=500',
    };

    const productImages = [
        'https://images.unsplash.com/photo-1625298378605-0ff5a3d13f0d?w=500',
        'https://images.unsplash.com/photo-1625298378695-9c67b3c22c15?w=500',
        'https://images.unsplash.com/photo-1625298378692-3946e6f75f0b?w=500',
        'https://images.unsplash.com/photo-1625298378683-e5e5e5a3e5b5?w=500',
    ];

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number);
    };

    return (
        <TestLayout>
            <Head title={`Detail - ${productData.nama_produk}`} />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                {/* Title Section */}
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link
                        href={route('produk.index')}
                        className="p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm shrink-0"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Product Details</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1">
                            Detailed information about your inventory.
                        </p>
                    </div>
                </div>

                {/* Buttons Section */}
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:gap-3">
                     <button className="inline-flex items-center justify-center py-2.5 px-3 sm:px-4 border border-gray-200 bg-white rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm">
                        <PencilSquareIcon className="w-4 h-4 mr-1.5 sm:mr-2" />
                        <span>Edit</span>
                    </button>
                    <button className="inline-flex items-center justify-center py-2.5 px-3 sm:px-6 bg-gray-900 rounded-xl text-xs sm:text-sm font-medium text-white hover:bg-gray-800 transition shadow-lg shadow-gray-200">
                        Add to Product
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Left Column - Product Image */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 h-full">
                        <h2 className="font-bold text-gray-900 mb-1">Product Image</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">Set your thumbnail product.</p>

                        {/* Main Image */}
                        <div className="bg-gray-50 rounded-xl aspect-square flex items-center justify-center mb-4 sm:mb-6 overflow-hidden border border-gray-100 relative group">
                            {productImages[selectedImage] ? (
                                <img
                                    src={productImages[selectedImage]}
                                    alt="Product Preview"
                                    className="w-full h-full object-contain p-4 mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <PhotoIcon className="h-20 w-20 text-gray-300" />
                            )}
                        </div>

                        {/* Thumbnails */}
                        <div className="grid grid-cols-4 gap-2 sm:gap-3">
                            {productImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`aspect-square rounded-xl overflow-hidden border transition-all p-1 bg-gray-50 ${
                                        selectedImage === index
                                            ? 'border-indigo-600 ring-1 ring-indigo-600 bg-white'
                                            : 'border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    <img
                                        src={img}
                                        alt={`Thumb ${index}`}
                                        className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                </button>
                            ))}
                            <button className="aspect-square rounded-xl border-2 border-dashed border-indigo-200 flex items-center justify-center hover:bg-indigo-50 transition text-indigo-500">
                                <span className="text-xl sm:text-2xl font-light">+</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column - Product Detail */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-1">Product Detail</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">Set your product information.</p>

                        <div className="space-y-6 sm:space-y-8">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Product Name</label>
                                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm">
                                    {productData.nama_produk}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Description</label>
                                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm leading-relaxed min-h-[100px] sm:min-h-[120px] shadow-sm">
                                    {productData.deskripsi}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Categories</label>
                                <div className="relative">
                                    <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm flex items-center justify-between shadow-sm">
                                        <span>{productData.kategori}</span>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Section */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Pricing</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 font-medium ml-1">Harga Online</span>
                                        <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium shadow-sm">
                                            {formatRupiah(productData.harga_online)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                         <span className="text-xs text-gray-500 font-medium ml-1">Harga Offline</span>
                                         <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium shadow-sm">
                                            {formatRupiah(productData.harga_offline)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stock Availability Section */}
                            <div className="pt-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Stock Availability</label>
                                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm flex items-center justify-between shadow-sm">
                                    <span className="flex items-center gap-2.5">
                                        <span className={`w-2.5 h-2.5 rounded-full ${productData.stok > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`}></span>
                                        <span className="font-medium">
                                            {productData.stok} {productData.satuan}
                                        </span>
                                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-md ${productData.stok > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            {productData.stok > 0 ? 'Available' : 'Out of Stock'}
                                        </span>
                                    </span>

                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </TestLayout>
    );
}
