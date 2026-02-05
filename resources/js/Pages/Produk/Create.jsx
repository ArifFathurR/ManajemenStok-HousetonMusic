import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import {
    ArrowLeftIcon, PhotoIcon, CloudArrowUpIcon,
    PlusIcon, TrashIcon, AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export default function ProdukCreate({ kategoris }) {

    // 1. Opsi Kategori (Database)
    const categoryOptions = kategoris.map(k => ({
        value: k.id,
        label: k.nama_kategori
    }));

    // 2. Opsi Satuan (Hardcode / Static)
    const satuanOptions = [
        { value: 'pcs', label: 'Pcs' },
        { value: 'unit', label: 'Unit' },
        { value: 'set', label: 'Set' },
        { value: 'box', label: 'Box' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        nama_produk: '',
        kategori_id: '',
        satuan: 'pcs', // Default value string
        deskripsi: '',
        gambar: null,
        is_variant: false,
        stok: '',
        harga_online: '',
        harga_offline: '',
        varians: [
            { nama_varian: '', stok: '', harga_online: '', harga_offline: '', gambar: null, preview: null }
        ]
    });

    const [imagePreview, setImagePreview] = useState(null);

    // --- CUSTOM STYLES (Updated: Animasi Chevron) ---
    const customSelectStyles = {
        control: (base, state) => ({
            ...base,
            borderRadius: '0.75rem',
            borderColor: state.isFocused ? '#6366f1' : '#e5e7eb',
            paddingTop: '0.15rem',
            paddingBottom: '0.15rem',
            boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : null,
            '&:hover': { borderColor: '#d1d5db' }
        }),
        menu: (base) => ({
            ...base,
            borderRadius: '0.75rem',
            zIndex: 9999,
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }),
        input: (base) => ({
            ...base,
            'input:focus': { boxShadow: 'none !important', outline: 'none !important' },
            boxShadow: 'none !important',
        }),
        // ANIMASI CHEVRON (Icon Panah)
        dropdownIndicator: (base, state) => ({
            ...base,
            transition: 'all .2s ease', // Animasi halus
            transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : null // Putar 180 derajat saat terbuka
        }),
        option: (base, state) => {
            if (state.data.__isNew__) {
                return {
                    ...base,
                    borderTop: '1px solid #f3f4f6',
                    color: '#4f46e5',
                    backgroundColor: state.isFocused ? '#eef2ff' : 'transparent',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    '&::before': { content: '"\\002B"', marginRight: '8px', fontSize: '1.3em', fontWeight: '400' },
                    ':active': { backgroundColor: '#e0e7ff' }
                };
            }
            return {
                ...base,
                backgroundColor: state.isFocused ? '#f9fafb' : 'white',
                color: state.isSelected ? '#111827' : '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem',
                paddingTop: '10px',
                paddingBottom: '10px',
                ':active': { backgroundColor: '#f3f4f6' }
            };
        },
        menuList: (base) => ({ ...base, paddingTop: 0, paddingBottom: 0 })
    };

    // --- HELPER & HANDLERS ---
    const formatInputPrice = (value) => {
        if (!value && value !== 0) return '';
        return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleCategoryChange = (newValue) => {
        setData('kategori_id', newValue ? newValue.value : '');
    };

    // Handler untuk Satuan (Select Biasa)
    const handleSatuanChange = (newValue) => {
        setData('satuan', newValue ? newValue.value : 'pcs');
    };

    const handleSingleChange = (field, e) => {
        let value = e.target.value;
        if (field === 'harga_online' || field === 'harga_offline' || field === 'stok') value = value.replace(/\D/g, '');
        setData(field, value);
    };

    const toggleVariantMode = (e) => setData('is_variant', e.target.checked);

    const addVariantRow = () => setData('varians', [...data.varians, { nama_varian: '', stok: '', harga_online: '', harga_offline: '', gambar: null, preview: null }]);

    const removeVariantRow = (index) => {
        const list = [...data.varians];
        if (list.length > 1) { list.splice(index, 1); setData('varians', list); }
    };

    const handleVariantChange = (e, index, field) => {
        const list = [...data.varians];
        let value = e.target.value;
        if (field === 'harga_online' || field === 'harga_offline' || field === 'stok') value = value.replace(/\D/g, '');
        list[index][field] = value;
        setData('varians', list);
    };

    const handleVariantImageChange = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { Swal.fire('Error', 'Maksimal 2MB', 'error'); return; }
            const list = [...data.varians];
            list[index].gambar = file;
            list[index].preview = URL.createObjectURL(file);
            setData('varians', list);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { Swal.fire('Error', 'Maksimal 2MB', 'error'); return; }
            setData('gambar', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('produk.store'), {
            forceFormData: true,
            onError: (err) => {
                console.log(err);
                Swal.fire({ title: 'Gagal Menyimpan!', text: 'Periksa kembali inputan Anda.', icon: 'error', confirmButtonColor: '#111827' });
            }
        });
    };

    return (
        <GeneralLayout>
            <Head title="Tambah Produk Baru" />

            <form onSubmit={handleSubmit} className="pb-32 md:pb-0">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link href={route('produk.index')} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm">
                            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Tambah Produk</h1>
                            <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Buat item inventaris baru.</p>
                        </div>
                    </div>
                    <div className="hidden md:flex gap-3">
                         <Link href={route('produk.index')} className="px-6 py-2.5 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Batal</Link>
                        <button type="submit" disabled={processing} className="px-6 py-2.5 bg-gray-900 rounded-xl text-sm font-medium text-white hover:bg-gray-800 transition shadow-lg shadow-gray-200 disabled:opacity-70">
                            {processing ? 'Menyimpan...' : 'Simpan Produk'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Image Upload */}
                    <div className="md:col-span-1">
                        <div className={`bg-white rounded-2xl p-5 shadow-sm border ${errors.gambar ? 'border-red-300' : 'border-gray-100'}`}>
                            <h2 className="font-bold text-gray-900 mb-1">Foto Produk</h2>
                            <label className="relative group flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer overflow-hidden mt-4">
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} className="w-full h-full object-contain p-4" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-medium flex items-center gap-2"><PhotoIcon className="w-4 h-4" /> Ganti</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center px-4">
                                        <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
                                        <p className="text-xs text-indigo-600 font-semibold">Unggah Foto</p>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                            {errors.gambar && <p className="mt-2 text-xs text-red-600 text-center">{errors.gambar}</p>}
                        </div>
                    </div>

                    {/* Form Details */}
                    <div className="md:col-span-2">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="space-y-5">
                                {/* Nama Produk */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nama Produk</label>
                                    <input type="text" value={data.nama_produk} onChange={e => setData('nama_produk', e.target.value)} className={`w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm focus:ring-indigo-500 focus:bg-white transition-colors ${errors.nama_produk ? 'border-red-500' : 'border-gray-200'}`} placeholder="Contoh: Grade A Meranti" />
                                    {errors.nama_produk && <p className="mt-1 text-xs text-red-600">{errors.nama_produk}</p>}
                                </div>

                                {/* ==================================================================== */}
                                {/* LAYOUT GRID-COLS-3 (Kategori 2 Bagian, Satuan 1 Bagian) */}
                                {/* ==================================================================== */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                                    {/* Kategori (Lebar: sm:col-span-2) */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Kategori</label>
                                        <CreatableSelect
                                            isClearable
                                            options={categoryOptions}
                                            onChange={handleCategoryChange}
                                            styles={customSelectStyles}
                                            placeholder="Pilih / Ketik..."
                                            formatCreateLabel={(inputValue) => `Tambah Kategori Baru: "${inputValue}"`}
                                            className="text-sm"
                                        />
                                        {errors.kategori_id && <p className="mt-1 text-xs text-red-600">{errors.kategori_id}</p>}
                                    </div>

                                    {/* Satuan (Kecil: sm:col-span-1) - Pake React Select */}
                                    <div className="sm:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Satuan</label>
                                        <Select
                                            options={satuanOptions}
                                            // Cari object yang valuenya sama dengan data.satuan untuk ditampilkan
                                            value={satuanOptions.find(option => option.value === data.satuan)}
                                            onChange={handleSatuanChange}
                                            styles={customSelectStyles}
                                            placeholder="Pilih"
                                            isSearchable={false} // Opsional: Matikan search jika opsinya sedikit
                                            className="text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100"></div>

                                {/* Toggle Variant */}
                                <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                                            <AdjustmentsHorizontalIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Punya Varian?</h3>
                                            <p className="text-[10px] text-gray-500">Warna, Ukuran, dll.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={data.is_variant} onChange={toggleVariantMode} />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {/* INPUT AREA (Single / Varian) */}
                                {!data.is_variant ? (
                                    <div className="space-y-4 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Jumlah Stok</label>
                                            <input type="text" inputMode="numeric" value={formatInputPrice(data.stok)} onChange={(e) => handleSingleChange('stok', e)} className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-semibold ${errors.stok ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                            {errors.stok && <p className="mt-1 text-xs text-red-600">{errors.stok}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga Online</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">Rp</span>
                                                    <input type="text" inputMode="numeric" value={formatInputPrice(data.harga_online)} onChange={(e) => handleSingleChange('harga_online', e)} className={`w-full pl-8 pr-3 py-2.5 bg-white border rounded-xl text-sm font-bold text-gray-900 focus:ring-indigo-500 ${errors.harga_online ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                                </div>
                                                {errors.harga_online && <p className="mt-1 text-xs text-red-600">{errors.harga_online}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga Offline</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-bold">Rp</span>
                                                    <input type="text" inputMode="numeric" value={formatInputPrice(data.harga_offline)} onChange={(e) => handleSingleChange('harga_offline', e)} className={`w-full pl-8 pr-3 py-2.5 bg-white border rounded-xl text-sm font-bold text-gray-600 focus:ring-indigo-500 ${errors.harga_offline ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                                </div>
                                                {errors.harga_offline && <p className="mt-1 text-xs text-red-600">{errors.harga_offline}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="space-y-3">
                                            {data.varians.map((varian, index) => (
                                                <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                    <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Varian #{index + 1}</span>
                                                        {data.varians.length > 1 && (
                                                            <button type="button" onClick={() => removeVariantRow(index)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="p-4 space-y-4">
                                                        <div className="flex gap-3">
                                                            <div className="shrink-0">
                                                                <label className="block w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden relative group">
                                                                    {varian.preview ? (
                                                                        <>
                                                                            <img src={varian.preview} className="w-full h-full object-cover" />
                                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><PhotoIcon className="w-5 h-5 text-white" /></div>
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex flex-col items-center justify-center h-full text-gray-400"><PhotoIcon className="w-6 h-6" /><span className="text-[9px] mt-1">Img</span></div>
                                                                    )}
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleVariantImageChange(e, index)} />
                                                                </label>
                                                                {errors[`varians.${index}.gambar`] && <p className="text-[9px] text-red-600 mt-1">Max 2MB</p>}
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Varian</label>
                                                                <input type="text" placeholder="Cth: Merah, XL" value={varian.nama_varian} onChange={(e) => handleVariantChange(e, index, 'nama_varian')} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:bg-white transition-colors" />
                                                                {errors[`varians.${index}.nama_varian`] && <p className="text-[10px] text-red-600 mt-1">Wajib diisi</p>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Stok Saat Ini</label>
                                                            <input type="text" inputMode="numeric" placeholder="0" value={formatInputPrice(varian.stok)} onChange={(e) => handleVariantChange(e, index, 'stok')} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold" />
                                                            {errors[`varians.${index}.stok`] && <p className="text-[10px] text-red-600 mt-1">Wajib diisi</p>}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Online</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-bold">Rp</span>
                                                                    <input type="text" inputMode='numeric' placeholder="0" value={formatInputPrice(varian.harga_online)} onChange={(e) => handleVariantChange(e, index, 'harga_online')} className="w-full pl-7 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Offline</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-2.5 top-2 text-[10px] text-gray-400 font-bold">Rp</span>
                                                                    <input type="text" inputMode='numeric' placeholder="0" value={formatInputPrice(varian.harga_offline)} onChange={(e) => handleVariantChange(e, index, 'harga_offline')} className="w-full pl-7 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={addVariantRow} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center gap-2 transition-all bg-white">
                                            <PlusIcon className="w-5 h-5" /> Tambah Varian Lain
                                        </button>
                                        {errors.varians && <p className="text-sm text-red-600 text-center">{errors.varians}</p>}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Deskripsi</label>
                                    <textarea rows="3" value={data.deskripsi} onChange={e => setData('deskripsi', e.target.value)} className="w-full h-60 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-indigo-500 focus:bg-white transition-colors" placeholder="Deskripsi produk..." ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Action Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-[100] md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-3">
                        <Link href={route('produk.index')} className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-200 bg-white rounded-xl text-sm font-bold text-gray-700 active:bg-gray-50">Batal</Link>
                        <button type="submit" disabled={processing} className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-gray-900 rounded-xl text-sm font-bold text-white active:bg-gray-800 disabled:opacity-70 shadow-lg shadow-gray-200">{processing ? 'Menyimpan...' : 'Simpan Produk'}</button>
                    </div>
                </div>

            </form>
        </GeneralLayout>
    );
}
