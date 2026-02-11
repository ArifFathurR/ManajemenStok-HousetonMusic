import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import {
    ArrowLeftIcon, PhotoIcon, CloudArrowUpIcon,
    PlusIcon, TrashIcon, AdjustmentsHorizontalIcon,
    SwatchIcon, ArrowsPointingOutIcon, PencilSquareIcon // Icons baru
} from '@heroicons/react/24/outline';

// --- DUMMY MASTER WARNA (Nanti dari DB) ---
const MASTER_WARNA = [
    { id: 1, label: 'Natural', hex: '#E3C08D' },
    { id: 2, label: 'Hitam', hex: '#000000' },
    { id: 3, label: 'Coklat', hex: '#5D4037' },
    { id: 4, label: 'Coklat Garis', hex: 'repeating-linear-gradient(90deg, #5D4037, #5D4037 2px, #3E2723 2px, #3E2723 4px)' },
    { id: 5, label: 'Biru', hex: '#2563EB' },
    { id: 6, label: 'Abu-abu', hex: '#9CA3AF' },
    { id: 7, label: 'Kuning', hex: '#FBBF24' },
    { id: 8, label: 'Putih', hex: '#FFFFFF' },
    { id: 9, label: 'Hijau', hex: '#10B981' },
    { id: 10, label: 'Pink', hex: '#F472B6' },
    { id: 11, label: 'Merah', hex: '#EF4444' },
    { id: 12, label: 'Sunburst', hex: 'radial-gradient(circle, #FCD34D 0%, #B45309 80%, #000000 100%)' },
    { id: 13, label: 'Natural Maple', hex: '#FDE68A' },
    { id: 14, label: 'Hitam Maple', hex: '#1F2937' },
    { id: 15, label: 'Coklat Maple', hex: '#92400E' },
    { id: 16, label: 'Pink Maple', hex: '#FBCFE8' },
    { id: 17, label: 'Biru Maple', hex: '#93C5FD' },
];

export default function ProdukCreate({ kategoris }) {

    // --- STATE UX VARIAN ---
    const [tipeVarian, setTipeVarian] = useState('warna'); // 'warna' | 'ukuran' | 'custom'
    const [pakaiGambarVarian, setPakaiGambarVarian] = useState(true);
    const [inputManualVarian, setInputManualVarian] = useState('');

    // --- EFFECT: Reset Config saat ganti tipe ---
    useEffect(() => {
        if (tipeVarian === 'ukuran') {
            setPakaiGambarVarian(false); // Ukuran default NO gambar
        } else {
            setPakaiGambarVarian(true); // Warna/Custom default YES gambar
        }
    }, [tipeVarian]);

    // --- DATA & FORM ---
    const categoryOptions = kategoris.map(k => ({ value: k.id, label: k.nama_kategori }));
    const satuanOptions = [
        { value: 'pcs', label: 'Pcs' }, { value: 'unit', label: 'Unit' },
        { value: 'set', label: 'Set' }, { value: 'box', label: 'Box' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        nama_produk: '',
        kategori_id: '',
        satuan: 'pcs',
        deskripsi: '',
        gambar: null,
        is_variant: false,
        stok: '',
        harga_online: '',
        harga_offline: '',
        // Array Varian Kosong Awalnya
        varians: []
    });

    const [imagePreview, setImagePreview] = useState(null);

    // --- HELPERS ---
    const formatInputPrice = (value) => {
        if (!value && value !== 0) return '';
        return Math.floor(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // --- LOGIC TAMBAH VARIAN (PINTAR) ---
    const tambahVarianOtomatis = (nama) => {
        if (!nama) return;

        // Cek duplikat
        if (data.varians.find(v => v.nama_varian.toLowerCase() === nama.toLowerCase())) {
            Swal.fire('Info', `Varian "${nama}" sudah ada`, 'info');
            return;
        }

        const newVarian = {
            nama_varian: nama,
            stok: '',
            harga_online: data.harga_online || '', // Warisi harga jika ada
            harga_offline: data.harga_offline || '',
            gambar: null,
            preview: null
        };

        setData('varians', [...data.varians, newVarian]);
        setInputManualVarian(''); // Reset input manual
    };

    // --- LOGIC HAPUS & EDIT VARIAN ---
    const removeVariantRow = (index) => {
        const list = [...data.varians];
        list.splice(index, 1);
        setData('varians', list);
    };

    const handleVariantChange = (e, index, field) => {
        const list = [...data.varians];
        let value = e.target.value;
        if (['harga_online', 'harga_offline', 'stok'].includes(field)) value = value.replace(/\D/g, '');
        list[index][field] = value;
        setData('varians', list);
    };

    const handleVariantImageChange = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            const list = [...data.varians];
            list[index].gambar = file;
            list[index].preview = URL.createObjectURL(file);
            setData('varians', list);
        }
    };

    // --- STANDARD HANDLERS ---
    const handleCategoryChange = (val) => setData('kategori_id', val?.value || '');
    const handleSatuanChange = (val) => setData('satuan', val?.value || 'pcs');
    const handleSingleChange = (field, e) => setData(field, e.target.value.replace(/\D/g, ''));

    // Toggle Mode Varian: Reset varians jika dimatikan
    const toggleVariantMode = (e) => {
        const checked = e.target.checked;
        setData(prev => ({
            ...prev,
            is_variant: checked,
            varians: checked ? [] : [] // Reset list saat toggle
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('gambar', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validasi Manual Stok Varian
        if (data.is_variant && data.varians.length === 0) {
            Swal.fire('Error', 'Minimal tambah 1 varian!', 'error');
            return;
        }
        post(route('produk.store'), { forceFormData: true });
    };

    // --- CUSTOM STYLES (Sama seperti sebelumnya) ---
    const customSelectStyles = { /* ...Copy Paste Style Sebelumnya... */
        control: (base, state) => ({ ...base, borderRadius: '0.75rem', borderColor: state.isFocused ? '#6366f1' : '#e5e7eb', boxShadow: 'none' }),
        input: (base) => ({ ...base, 'input:focus': { boxShadow: 'none !important' } }),
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
                        <h1 className="text-lg font-bold text-gray-900">Tambah Produk</h1>
                    </div>
                    <button type="submit" disabled={processing} className="hidden md:block px-6 py-2.5 bg-gray-900 rounded-xl text-sm font-medium text-white hover:bg-gray-800 transition shadow-lg disabled:opacity-70">
                        {processing ? 'Menyimpan...' : 'Simpan Produk'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* FOTO UTAMA */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h2 className="font-bold text-gray-900 mb-1">Foto Sampul</h2>
                            <label className="relative group flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer overflow-hidden mt-4">
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-contain p-2" />
                                ) : (
                                    <div className="text-center px-4">
                                        <CloudArrowUpIcon className="w-8 h-8 text-gray-400 mb-2 mx-auto" />
                                        <p className="text-xs text-indigo-600 font-semibold">Upload Foto</p>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                    </div>

                    {/* FORM UTAMA */}
                    <div className="md:col-span-2 space-y-5">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">
                            {/* Nama & Kategori */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Nama Produk</label>
                                <input type="text" value={data.nama_produk} onChange={e => setData('nama_produk', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-indigo-500" placeholder="Contoh: Kemeja Polos" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Kategori</label>
                                    <CreatableSelect options={categoryOptions} onChange={handleCategoryChange} styles={customSelectStyles} placeholder="Pilih..." />
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Satuan</label>
                                    <Select options={satuanOptions} defaultValue={satuanOptions[0]} onChange={handleSatuanChange} styles={customSelectStyles} />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 my-4"></div>

                            {/* --- TOGGLE AKTIFKAN VARIAN --- */}
                            <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><AdjustmentsHorizontalIcon className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Aktifkan Varian?</h3>
                                        <p className="text-[10px] text-gray-500">Warna, Ukuran, Tipe, dll.</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={data.is_variant} onChange={toggleVariantMode} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* --- AREA INPUT DINAMIS --- */}
                            {!data.is_variant ? (
                                // MODE SINGLE PRODUK (INPUT BIASA)
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Stok</label>
                                        <input type="text" inputMode="numeric" value={formatInputPrice(data.stok)} onChange={(e) => handleSingleChange('stok', e)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold" placeholder="0" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga Online</label>
                                            <input type="text" inputMode="numeric" value={formatInputPrice(data.harga_online)} onChange={(e) => handleSingleChange('harga_online', e)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold" placeholder="Rp 0" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Harga Offline</label>
                                            <input type="text" inputMode="numeric" value={formatInputPrice(data.harga_offline)} onChange={(e) => handleSingleChange('harga_offline', e)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold" placeholder="Rp 0" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // MODE VARIAN PINTAR (UX BARU)
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">

                                    {/* 1. PILIH TIPE VARIAN */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <div className="flex gap-2 mb-4 overflow-x-auto hide-scroll pb-1">
                                            {[
                                                { id: 'warna', label: 'Warna', icon: SwatchIcon },
                                                { id: 'ukuran', label: 'Ukuran', icon: ArrowsPointingOutIcon },
                                                { id: 'custom', label: 'Lainnya', icon: PencilSquareIcon },
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setTipeVarian(type.id)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${tipeVarian === type.id
                                                            ? 'bg-black text-white border-black shadow-md transform scale-105'
                                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <type.icon className="w-4 h-4" /> {type.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* 2. AREA INPUT BERDASARKAN TIPE */}
                                        <div className="space-y-4">
                                            {tipeVarian === 'warna' && (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-2 font-medium">Pilih warna populer:</p>
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {MASTER_WARNA.map(w => (
                                                            <button
                                                                key={w.id} type="button"
                                                                onClick={() => tambahVarianOtomatis(w.label)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium hover:border-black hover:bg-gray-50 transition-all active:scale-95"
                                                            >
                                                                <span className="w-3 h-3 rounded-full border border-gray-100 shadow-sm" style={{ background: w.hex }}></span>
                                                                {w.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={inputManualVarian}
                                                    onChange={(e) => setInputManualVarian(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), tambahVarianOtomatis(inputManualVarian))}
                                                    placeholder={tipeVarian === 'ukuran' ? "Ketik ukuran (S, M, 42)... Enter" : "Ketik varian manual... Enter"}
                                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-black focus:border-black"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => tambahVarianOtomatis(inputManualVarian)}
                                                    className="px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition"
                                                >
                                                    <PlusIcon className="w-5 h-5" />
                                                </button>
                                            </div>

                                            {/* Toggle Gambar (Hanya muncul jika bukan Ukuran) */}
                                            {tipeVarian !== 'ukuran' && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" checked={pakaiGambarVarian} onChange={(e) => setPakaiGambarVarian(e.target.checked)} />
                                                        <div className="w-7 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-black"></div>
                                                    </label>
                                                    <span className="text-[10px] text-gray-500 font-medium">Pakai Foto per Varian</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. LIST VARIAN YANG DITAMBAHKAN */}
                                    <div className="space-y-3">
                                        {data.varians.map((varian, index) => (
                                            <div key={index} className="flex gap-3 items-start p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-300 transition-all group">

                                                {/* GAMBAR VARIAN (Kondisional) */}
                                                {pakaiGambarVarian && (
                                                    <label className="shrink-0 w-12 h-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-indigo-500 overflow-hidden relative">
                                                        {varian.preview ? <img src={varian.preview} className="w-full h-full object-cover" /> : <PhotoIcon className="w-4 h-4 text-gray-400" />}
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleVariantImageChange(e, index)} />
                                                    </label>
                                                )}

                                                <div className="flex-1 min-w-0 grid grid-cols-12 gap-3">
                                                    {/* Nama */}
                                                    <div className="col-span-4 sm:col-span-3">
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Nama</label>
                                                        <input type="text" value={varian.nama_varian} onChange={(e) => handleVariantChange(e, index, 'nama_varian')} className="w-full p-0 border-none text-sm font-bold text-gray-900 focus:ring-0 bg-transparent" />
                                                    </div>
                                                    {/* Stok */}
                                                    <div className="col-span-3 sm:col-span-2">
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Stok</label>
                                                        <input type="text" inputMode="numeric" placeholder="0" value={formatInputPrice(varian.stok)} onChange={(e) => handleVariantChange(e, index, 'stok')} className="w-full p-1 bg-gray-50 border border-gray-200 rounded text-xs text-center font-bold focus:border-black focus:ring-0" />
                                                    </div>
                                                    {/* Harga (Hidden di HP kecil, muncul di SM) */}
                                                    <div className="col-span-5 sm:col-span-3">
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Hrg Online</label>
                                                        <input type="text" inputMode="numeric" placeholder="0" value={formatInputPrice(varian.harga_online)} onChange={(e) => handleVariantChange(e, index, 'harga_online')} className="w-full p-1 bg-gray-50 border border-gray-200 rounded text-xs text-right font-medium focus:border-black focus:ring-0" />
                                                    </div>
                                                    <div className="hidden sm:block col-span-3">
                                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Hrg Offline</label>
                                                        <input type="text" inputMode="numeric" placeholder="0" value={formatInputPrice(varian.harga_offline)} onChange={(e) => handleVariantChange(e, index, 'harga_offline')} className="w-full p-1 bg-gray-50 border border-gray-200 rounded text-xs text-right font-medium focus:border-black focus:ring-0" />
                                                    </div>
                                                </div>

                                                <button type="button" onClick={() => removeVariantRow(index)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        {data.varians.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400">
                                                <p className="text-xs">Belum ada varian ditambahkan.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Deskripsi */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Deskripsi</label>
                            <textarea rows="4" value={data.deskripsi} onChange={e => setData('deskripsi', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-black focus:bg-white" placeholder="Deskripsi produk..." ></textarea>
                        </div>
                    </div>
                </div>

                {/* Mobile Action */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-50">
                    <button type="submit" disabled={processing} className="w-full py-3 bg-gray-900 rounded-xl text-sm font-bold text-white shadow-lg">{processing ? 'Menyimpan...' : 'Simpan Produk'}</button>
                </div>
            </form>
        </GeneralLayout>
    );
}
