import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import {
    ArrowLeftIcon, PhotoIcon, CloudArrowUpIcon,
    PlusIcon, TrashIcon, AdjustmentsHorizontalIcon, XCircleIcon
} from '@heroicons/react/24/outline';

export default function ProdukCreate() {
    const { data, setData, post, processing, errors } = useForm({
        nama_produk: '',
        kategori: '',
        satuan: 'pcs',
        deskripsi: '',
        gambar: null,

        // Logic Varian
        is_variant: false,
        stok: '',
        harga_online: '',
        harga_offline: '',

        // Array Varian (tambah properti gambar & preview)
        varians: [
            { nama_varian: '', stok: '', harga_online: '', harga_offline: '', gambar: null, preview: null }
        ]
    });

    const [imagePreview, setImagePreview] = useState(null);

    // Toggle Mode
    const toggleVariantMode = (e) => setData('is_variant', e.target.checked);

    // Tambah Varian
    const addVariantRow = () => {
        setData('varians', [
            ...data.varians,
            { nama_varian: '', stok: '', harga_online: '', harga_offline: '', gambar: null, preview: null }
        ]);
    };

    // Hapus Varian
    const removeVariantRow = (index) => {
        const list = [...data.varians];
        if (list.length > 1) {
            list.splice(index, 1);
            setData('varians', list);
        }
    };

    // Handle Input Teks Varian
    const handleVariantChange = (e, index, field) => {
        const list = [...data.varians];
        list[index][field] = e.target.value;
        setData('varians', list);
    };

    // Handle GAMBAR Varian (New Feature)
    const handleVariantImageChange = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                Swal.fire('Error', 'Maksimal 2MB', 'error');
                return;
            }
            const list = [...data.varians];
            list[index].gambar = file;
            list[index].preview = URL.createObjectURL(file); // Buat preview lokal
            setData('varians', list);
        }
    };

    // Handle Gambar Utama Parent
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                Swal.fire('Error', 'Maksimal 2MB', 'error');
                return;
            }
            setData('gambar', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('produk.store'), {
            onError: (err) => {
                console.log(err);
                Swal.fire({
                    title: 'Gagal Menyimpan!',
                    text: 'Periksa kembali inputan Anda.',
                    icon: 'error',
                    confirmButtonColor: '#111827'
                });
            }
        });
    };

    return (
        <GeneralLayout>
            <Head title="Add New Product" />

            <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-3">
                        <Link href={route('produk.index')} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm">
                            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
                            <p className="text-sm text-gray-500">Create new inventory item.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <Link href={route('produk.index')} className="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</Link>
                        <button type="submit" disabled={processing} className="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-2.5 bg-gray-900 rounded-xl text-sm font-medium text-white hover:bg-gray-800 transition shadow-lg shadow-gray-200 disabled:opacity-70">
                            {processing ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

                    {/* LEFT: Main Image */}
                    <div className="md:col-span-1">
                        <div className={`bg-white rounded-2xl p-6 shadow-sm border h-full ${errors.gambar ? 'border-red-300' : 'border-gray-100'}`}>
                            <h2 className="font-bold text-gray-900 mb-1">Thumbnail</h2>
                            <p className="text-sm text-gray-500 mb-6">Main product image.</p>
                            <label className={`relative group flex flex-col items-center justify-center w-full aspect-square rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${imagePreview ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} className="w-full h-full object-contain p-4" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-sm font-medium flex items-center gap-2"><PhotoIcon className="w-5 h-5" /> Change</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center px-4">
                                        <CloudArrowUpIcon className="w-10 h-10 text-gray-400 mb-3 mx-auto" />
                                        <p className="text-sm text-indigo-600 font-semibold">Click to upload</p>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                            {errors.gambar && <p className="mt-2 text-xs text-red-600">{errors.gambar}</p>}
                        </div>
                    </div>

                    {/* RIGHT: Details */}
                    <div className="md:col-span-1 lg:col-span-2">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                            <h2 className="font-bold text-gray-900 mb-1">Product Details</h2>
                            <p className="text-sm text-gray-500 mb-6">General information.</p>

                            <div className="space-y-5">
                                {/* Basic Info Inputs (Name, Category, Unit) */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={data.nama_produk} onChange={e => setData('nama_produk', e.target.value)} className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:ring-indigo-500 ${errors.nama_produk ? 'border-red-500' : 'border-gray-200'}`} placeholder="Product Name" />
                                    {errors.nama_produk && <p className="mt-1 text-xs text-red-600">{errors.nama_produk}</p>}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                        <input type="text" value={data.kategori} onChange={e => setData('kategori', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-indigo-500" placeholder="Category" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Unit <span className="text-red-500">*</span></label>
                                        <select value={data.satuan} onChange={e => setData('satuan', e.target.value)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-indigo-500">
                                            <option value="pcs">Pcs</option><option value="unit">Unit</option><option value="set">Set</option><option value="box">Box</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-4"></div>

                                {/* Toggle Variant */}
                                <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                            <AdjustmentsHorizontalIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Product Variants</h3>
                                            <p className="text-xs text-gray-500">Enable for multiple options (Color, Size, etc).</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={data.is_variant} onChange={toggleVariantMode} />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {/* INPUT AREA */}
                                {!data.is_variant ? (
                                    // Single Mode (Sama seperti sebelumnya)
                                    <div className="space-y-5 animate-fade-in">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Stock <span className="text-red-500">*</span></label>
                                            <input type="number" value={data.stok} onChange={e => setData('stok', e.target.value)} className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm focus:ring-indigo-500 ${errors.stok ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                            {errors.stok && <p className="mt-1 text-xs text-red-600">{errors.stok}</p>}
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">ONLINE PRICE (RP) <span className="text-red-500">*</span></label>
                                                <input type="number" value={data.harga_online} onChange={e => setData('harga_online', e.target.value)} className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-bold focus:ring-indigo-500 ${errors.harga_online ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                                {errors.harga_online && <p className="mt-1 text-xs text-red-600">{errors.harga_online}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">OFFLINE PRICE (RP) <span className="text-red-500">*</span></label>
                                                <input type="number" value={data.harga_offline} onChange={e => setData('harga_offline', e.target.value)} className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-bold focus:ring-indigo-500 ${errors.harga_offline ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                                {errors.harga_offline && <p className="mt-1 text-xs text-red-600">{errors.harga_offline}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // VARIANT MODE (UPDATED: Ada kolom Gambar)
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                            {data.varians.map((varian, index) => (
                                                <div key={index} className="p-4 border-b border-gray-200 last:border-0 relative">
                                                    {/* Header Varian */}
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase">Variant #{index + 1}</h4>
                                                        {data.varians.length > 1 && (
                                                            <button type="button" onClick={() => removeVariantRow(index)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                                                                <TrashIcon className="w-4 h-4" /> Remove
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-4">
                                                        {/* 1. INPUT GAMBAR VARIAN (KOLOM BARU) */}
                                                        <div className="shrink-0 mt-4">
                                                            <label className="block w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-white cursor-pointer overflow-hidden relative group">
                                                                {varian.preview ? (
                                                                    <>
                                                                        <img src={varian.preview} className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                                            <PhotoIcon className="w-5 h-5 text-white" />
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                                        <PhotoIcon className="w-6 h-6" />
                                                                        <span className="text-[9px] mt-1">Img</span>
                                                                    </div>
                                                                )}
                                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleVariantImageChange(e, index)} />
                                                            </label>
                                                            {errors[`varians.${index}.gambar`] && <p className="text-[9px] text-red-600 mt-1">Max 2MB</p>}
                                                        </div>

                                                        {/* 2. INPUT DATA (GRID) */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                                            <div className="sm:col-span-2">
                                                                <label className="text-[10px] font-semibold text-gray-500 uppercase">Variant Name</label>
                                                                <input type="text" placeholder="e.g. Red / XL" value={varian.nama_varian} onChange={(e) => handleVariantChange(e, index, 'nama_varian')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-indigo-500" required />
                                                                {errors[`varians.${index}.nama_varian`] && <p className="text-[10px] text-red-600 mt-1">Required</p>}
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-semibold text-gray-500 uppercase">Stock</label>
                                                                <input type="number" placeholder="0" value={varian.stok} onChange={(e) => handleVariantChange(e, index, 'stok')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-indigo-500" required />
                                                                {errors[`varians.${index}.stok`] && <p className="text-[10px] text-red-600 mt-1">Required</p>}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Online (Rp)</label>
                                                                    <input type="number" placeholder="0" value={varian.harga_online} onChange={(e) => handleVariantChange(e, index, 'harga_online')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-indigo-500" required />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Offline (Rp)</label>
                                                                    <input type="number" placeholder="0" value={varian.harga_offline} onChange={(e) => handleVariantChange(e, index, 'harga_offline')} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-indigo-500" required />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={addVariantRow} className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium hover:border-indigo-500 hover:text-indigo-600 transition flex items-center justify-center gap-2">
                                            <PlusIcon className="w-5 h-5" /> Add Another Variant
                                        </button>
                                        {errors.varians && <p className="text-sm text-red-600 text-center">{errors.varians}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                    <textarea rows="3" value={data.deskripsi} onChange={e => setData('deskripsi', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-indigo-500" placeholder="Product details..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </GeneralLayout>
    );
}
