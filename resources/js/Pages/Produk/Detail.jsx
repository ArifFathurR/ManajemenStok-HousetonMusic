import GeneralLayout from "@/Layouts/GeneralLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import {
    ArrowLeftIcon,
    PencilSquareIcon,
    PhotoIcon,
} from "@heroicons/react/24/outline";

export default function ProductDetail({ produk }) {
    // Ambil URL dari Inertia agar Reaktif
    const { url } = usePage();

    // 1. State Varian
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

    // 2. State Gambar Preview
    const [previewImage, setPreviewImage] = useState(produk.image_url);

    // 3. EFFECT: Mendeteksi URL Parameter (variant_id) setiap kali halaman dimuat/berubah
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const variantIdFromUrl = queryParams.get("variant_id");

        if (variantIdFromUrl && produk.varians.length > 0) {
            // Cari index varian yang cocok dengan ID di URL
            const foundIndex = produk.varians.findIndex(
                (v) => v.id == variantIdFromUrl
            );

            if (foundIndex !== -1) {
                // Set Index Varian
                setSelectedVariantIndex(foundIndex);

                // PENTING: Set Gambar Preview sesuai varian tersebut
                const variantImg = produk.varians[foundIndex].gambar_url || produk.image_url;
                setPreviewImage(variantImg);
            }
        } else {
            // Jika tidak ada parameter variant_id, reset ke default
            setSelectedVariantIndex(0);
            setPreviewImage(produk.image_url);
        }
    }, [url, produk]);

    const variants = produk.varians || [];
    const activeVariant = variants[selectedVariantIndex] || {};

    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(number || 0);
    };

    // Handler: Klik Thumbnail UTAMA
    const handleMainImageClick = () => {
        setPreviewImage(produk.image_url);
    };

    // Handler: Klik Thumbnail VARIAN
    const handleVariantClick = (index) => {
        setSelectedVariantIndex(index);
        const variantImg = variants[index].gambar_url || produk.image_url;
        setPreviewImage(variantImg);
    };

    return (
        <GeneralLayout>
            <Head title={`Detail - ${produk.nama_produk}`} />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link
                        href={route("produk.index")}
                        className="p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm shrink-0"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                            Detail Produk
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1">
                            Informasi lengkap mengenai produk Anda.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:gap-3">
                    <Link
                        href={route("produk.edit", produk.id)}
                        className="inline-flex items-center justify-center py-2.5 px-3 sm:px-4 border border-gray-200 bg-white rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
                    >
                        <PencilSquareIcon className="w-4 h-4 mr-1.5 sm:mr-2" />
                        <span>Edit</span>
                    </Link>
                    <button className="inline-flex items-center justify-center py-2.5 px-3 sm:px-6 bg-gray-900 rounded-xl text-xs sm:text-sm font-medium text-white hover:bg-gray-800 transition shadow-lg shadow-gray-200">
                        Tambah Stok
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Left Column - Product Image */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 h-full">
                        <h2 className="font-bold text-gray-900 mb-1">
                            Foto Produk
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
                            {previewImage === produk.image_url
                                ? "Foto utama produk."
                                : `Varian: ${activeVariant.nama_varian}`}
                        </p>

                        {/* PREVIEW GAMBAR BESAR */}
                        <div className="bg-gray-50 rounded-xl aspect-square flex items-center justify-center mb-4 sm:mb-6 overflow-hidden border border-gray-100 relative group">
                            {previewImage ? (
                                <img
                                    src={previewImage}
                                    alt="Pratinjau Produk"
                                    className={`w-full h-full object-contain p-4 mix-blend-multiply transition-transform duration-300 group-hover:scale-105 ${activeVariant.stok === 0 ? "grayscale opacity-75" : ""}`}
                                />
                            ) : (
                                <PhotoIcon className="h-20 w-20 text-gray-300" />
                            )}

                            {/* === ALERT STOK HABIS === */}
                            {activeVariant.stok === 0 && (
                                <div className="absolute top-3 right-3">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-100 shadow-sm">
                                        Stok Habis
                                    </span>
                                </div>
                            )}

                            {/* Label Nama Varian */}
                            {variants.length > 0 &&
                                previewImage !== produk.image_url && (
                                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md">
                                        {activeVariant.nama_varian}
                                    </div>
                                )}
                        </div>

                        {/* THUMBNAILS GALLERY */}
                        {variants.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 sm:gap-3 animate-fade-in">
                                {/* 1. THUMBNAIL UTAMA */}
                                <button
                                    onClick={handleMainImageClick}
                                    className={`aspect-square rounded-xl overflow-hidden border transition-all p-1 bg-gray-50 ${
                                        previewImage === produk.image_url
                                            ? "border-indigo-600 ring-1 ring-indigo-600 bg-white"
                                            : "border-transparent hover:border-gray-300"
                                    }`}
                                    title="Foto Utama"
                                >
                                    {produk.image_url ? (
                                        <img
                                            src={produk.image_url}
                                            alt="Utama"
                                            className="w-full h-full object-contain mix-blend-multiply"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <PhotoIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                </button>

                                {/* 2. THUMBNAIL VARIAN */}
                                {variants.map((variant, index) => {
                                    const thumbImage = variant.gambar_url;
                                    const isSelected = selectedVariantIndex === index && previewImage !== produk.image_url;

                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => handleVariantClick(index)}
                                            className={`aspect-square rounded-xl overflow-hidden border transition-all p-1 bg-gray-50 relative ${
                                                isSelected
                                                    ? "border-indigo-600 ring-1 ring-indigo-600 bg-white"
                                                    : "border-transparent hover:border-gray-300"
                                            }`}
                                            title={variant.nama_varian}
                                        >
                                            {/* Warning Stok 0 */}
                                            {variant.stok === 0 && (
                                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                                                    <span className="text-sm font-bold drop-shadow-sm">⚠️</span>
                                                </div>
                                            )}

                                            {thumbImage ? (
                                                <img
                                                    src={thumbImage}
                                                    alt={variant.nama_varian}
                                                    className={`w-full h-full object-contain mix-blend-multiply ${variant.stok === 0 ? "grayscale" : ""}`}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                                                    <span className="text-[10px] font-bold">
                                                        {variant.nama_varian.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Product Detail */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 h-full">
                        <h2 className="font-bold text-gray-900 mb-1">
                            Rincian Produk
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
                            Informasi lengkap produk ini.
                        </p>

                        <div className="space-y-6 sm:space-y-8">
                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                                    Nama Produk
                                </label>
                                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition shadow-sm">
                                    {produk.nama_produk}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                                    Deskripsi
                                </label>
                                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 text-sm leading-relaxed min-h-[100px] sm:min-h-[120px] shadow-sm">
                                    {produk.deskripsi || "Tidak ada deskripsi."}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                                    Kategori
                                </label>
                                <div className="relative">
                                    <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm flex items-center justify-between shadow-sm">
                                        <span>{produk.kategori || "-"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Section */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                                    Harga{" "}
                                    {variants.length > 1 && (
                                        <span className="text-indigo-600 text-xs font-normal ml-1">
                                            ({activeVariant.nama_varian})
                                        </span>
                                    )}
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 font-medium ml-1">
                                            Harga Online
                                        </span>
                                        <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium shadow-sm">
                                            {formatRupiah(activeVariant.harga_online)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 font-medium ml-1">
                                            Harga Offline
                                        </span>
                                        <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm font-medium shadow-sm">
                                            {formatRupiah(activeVariant.harga_offline)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stock Availability Section */}
                            <div className="pt-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                                    Ketersediaan Stok
                                </label>
                                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm flex items-center justify-between shadow-sm">
                                    <span className="flex items-center gap-2.5">
                                        <span className={`w-2.5 h-2.5 rounded-full ${activeVariant.stok > 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500"}`}></span>
                                        <span className="font-medium">
                                            {activeVariant.stok} {produk.satuan}
                                        </span>
                                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-md ${activeVariant.stok > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                            {activeVariant.stok > 0 ? "Tersedia" : "Stok Habis"}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </GeneralLayout>
    );
}
