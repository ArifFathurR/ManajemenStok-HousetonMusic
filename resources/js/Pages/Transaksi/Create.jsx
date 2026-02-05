import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, usePage } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import {
    MagnifyingGlassIcon, ShoppingCartIcon, TrashIcon, CreditCardIcon,
    DevicePhoneMobileIcon, BanknotesIcon, PlusIcon, MinusIcon,
    CubeIcon, XMarkIcon, PrinterIcon, ChevronUpIcon, ChevronDownIcon,
    CheckCircleIcon, ExclamationCircleIcon, PhotoIcon,
    BuildingStorefrontIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

export default function Create({ auth, products, toko }) {
    const { props } = usePage();

    // --- STATE ---
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [channel, setChannel] = useState('offline');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discount, setDiscount] = useState(0);
    const [customerMoney, setCustomerMoney] = useState(0);
    const [showReceipt, setShowReceipt] = useState(false);
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [transactionCode, setTransactionCode] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [imageErrors, setImageErrors] = useState({});

    // --- LOGIC ---
    const handleImageError = (productId) => setImageErrors(prev => ({ ...prev, [productId]: true }));

    const filteredProducts = products.filter(p =>
        p.nama_produk.toLowerCase().includes(search.toLowerCase()) ||
        (p.kategori && p.kategori.toLowerCase().includes(search.toLowerCase()))
    );

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

    const showAlert = (message, type = 'info') => {
        setAlertMessage({ message, type });
        setTimeout(() => setAlertMessage(null), 4000);
    };

    // --- CART ACTIONS ---
    const handleProductClick = (product) => {
        if (product.stok <= 0 && (!product.variants || product.variants.length === 0)) {
            showAlert('Stok habis', 'error'); return;
        }
        if (product.variants && product.variants.length > 0) {
            setSelectedProduct(product); setShowVariantModal(true);
        } else {
            addToCart(product, null);
        }
    };

    const addToCart = (product, variant) => {
        const variantId = variant ? variant.id : null;
        const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}`;
        const availableStock = variant ? variant.stok : product.stok;
        const existing = cart.find(item => item.cartItemId === cartItemId);
        const currentQty = existing ? existing.qty : 0;

        if (currentQty >= availableStock) {
            showAlert(`Stok tidak cukup. Sisa: ${availableStock}`, 'error'); return;
        }

        if (existing) {
            setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, {
                ...product, cartItemId, variantId,
                variantName: variant ? variant.name : null,
                qty: 1, stok: availableStock,
                harga_online: variant ? variant.harga_online : product.harga_online,
                harga_offline: variant ? variant.harga_offline : product.harga_offline,
            }]);
        }
        setShowVariantModal(false);
    };

    const updateQty = (cartItemId, delta) => {
        setCart(cart.map(item => {
            if (item.cartItemId === cartItemId) {
                const newQty = item.qty + delta;
                if (newQty > item.stok) { showAlert(`Max stok: ${item.stok}`, 'error'); return item; }
                if (newQty < 1) return null;
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    const removeFromCart = (cartItemId) => setCart(cart.filter(item => item.cartItemId !== cartItemId));

    // --- CALCULATIONS ---
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + ((channel === 'online' ? item.harga_online : item.harga_offline) * item.qty), 0), [cart, channel]);
    const grandTotal = Math.max(0, subtotal - discount);

    useEffect(() => { if (paymentMethod !== 'cash') setCustomerMoney(grandTotal); }, [grandTotal, paymentMethod]);

    const change = useMemo(() => (paymentMethod === 'cash' && customerMoney >= grandTotal ? customerMoney - grandTotal : 0), [customerMoney, grandTotal, paymentMethod]);
    const quickAmounts = [50000, 100000, 200000, 500000];

    // --- TRANSAKSI ---
    const handleFinalize = async () => {
        if (cart.length === 0) return showAlert('Keranjang kosong', 'error');

        setIsProcessing(true);

        const payload = {
            cart: cart.map(i => ({
                id: i.id,
                variantId: i.variantId || null,
                qty: parseInt(i.qty)
            })),
            channel: channel,
            paymentMethod: paymentMethod,
            discount: parseFloat(discount) || 0,
            customerMoney: parseFloat(paymentMethod === 'cash' ? customerMoney : grandTotal) || 0
        };

        try {
            const response = await axios.post(route('transaksi.store'), payload);

            if (response.data.success) {
                setTransactionCode(response.data.kode_transaksi);
                setShowReceipt(true);
                showAlert('Transaksi Berhasil', 'success');
            } else {
                showAlert(response.data.message || 'Gagal', 'error');
            }
        } catch (error) {
            console.error(error);
            if (error.response && error.response.data && error.response.data.message) {
                showAlert(error.response.data.message, 'error');
            } else {
                showAlert('Terjadi kesalahan sistem', 'error');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTransaction = () => {
        setCart([]); setDiscount(0); setCustomerMoney(0); setShowReceipt(false); setIsCartExpanded(false); setChannel('offline'); setPaymentMethod('cash');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <GeneralLayout>
            <Head title="Kasir" />

            {/* --- CSS KHUSUS PRINT 80MM --- */}
            {/* Strategi: Sembunyikan SEMUA, lalu tampilkan HANYA #printable-receipt */}
            <style>{`
                /* Default di layar: Sembunyikan area cetak duplikat */
                #printable-receipt { display: none; }

                @media print {
                    /* 1. Sembunyikan Body dan Konten UI */
                    body * {
                        visibility: hidden;
                        height: 0;
                        overflow: hidden;
                    }

                    /* 2. Reset Body */
                    body, html {
                        margin: 0; padding: 0;
                        height: 100%; width: 100%;
                        background-color: white;
                        overflow: visible !important;
                    }

                    /* 3. Tampilkan Area Struk & Isinya */
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                        height: auto;
                        overflow: visible;
                    }

                    /* 4. Posisikan Struk di Pojok Kertas */
                    #printable-receipt {
                        display: block !important;
                        position: absolute;
                        left: 0; top: 0;
                        width: 80mm;
                        margin: 0; padding: 0;
                        background-color: white;
                        z-index: 99999;
                        border: none;
                    }

                    /* 5. Setting Kertas */
                    @page { size: 80mm auto; margin: 0; }

                    /* 6. Helper */
                    .no-print { display: none !important; }
                }

                .hide-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Alert */}
            {alertMessage && (
                <div className={`fixed top-6 right-6 z-[100] animate-in slide-in-from-top duration-300 ${alertMessage.type === 'error' ? 'bg-black text-white border-l-4 border-red-500' : 'bg-black text-white border-l-4 border-green-500'} px-4 py-3 rounded shadow-2xl flex items-center gap-3 no-print`}>
                    {alertMessage.type === 'error' ? <ExclamationCircleIcon className="w-5 h-5 text-red-500"/> : <CheckCircleIcon className="w-5 h-5 text-green-500"/>}
                    <span className="text-sm font-bold">{alertMessage.message}</span>
                </div>
            )}

            {/* MAIN CONTENT (Akan di-hide saat print) */}
            <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans relative pb-24 lg:pb-0 no-print">

                {/* --- KIRI: KATALOG --- */}
                <div className="flex-1 flex flex-col h-full border-r border-gray-200">
                    <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white z-0 relative">
                        <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                            <button onClick={() => setChannel('offline')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${channel === 'offline' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>TOKO</button>
                            <button onClick={() => setChannel('online')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${channel === 'online' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>ONLINE</button>
                        </div>
                        <div className="relative w-full sm:w-64 group">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-gray-900 transition-colors" />
                            <input type="text" placeholder="Cari produk..." className="w-full bg-gray-50 border-transparent focus:border-gray-300 focus:bg-white focus:ring-0 rounded-lg py-2 pl-9 pr-4 text-sm transition-all placeholder-gray-400 font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30 hide-scroll pb-32 lg:pb-5">
                        {filteredProducts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <CubeIcon className="w-16 h-16 mb-2 opacity-20" />
                                <p className="text-xs font-medium">Produk tidak ditemukan</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                {filteredProducts.map(product => {
                                    const hasError = imageErrors[product.id];
                                    const isOutOfStock = product.stok <= 0 && !product.is_variant;

                                    const rawImage = product.gambar || product.gambar_utama;
                                    const imgPath = rawImage
                                        ? (rawImage.startsWith('http') ? rawImage : `/storage/${rawImage}`)
                                        : null;

                                    return (
                                        <div key={product.id} onClick={() => handleProductClick(product)} className={`bg-white rounded-xl border border-gray-100 p-2 cursor-pointer transition-all hover:border-gray-400 hover:shadow-sm active:scale-[0.98] flex flex-col relative group ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}>
                                            <div className="aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                                                {imgPath && !hasError ? (
                                                    <img src={imgPath} alt={product.nama_produk} className="w-full h-full object-contain p-2 mix-blend-multiply transition-transform duration-500 group-hover:scale-105" onError={() => handleImageError(product.id)} loading="lazy" />
                                                ) : (
                                                    <PhotoIcon className="w-8 h-8 text-gray-300" />
                                                )}
                                                {isOutOfStock && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><span className="bg-black text-white text-[9px] font-bold px-2 py-1 rounded">HABIS</span></div>}
                                            </div>
                                            <div className="px-1 flex flex-col flex-1">
                                                <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2 mb-1">{product.nama_produk}</h4>
                                                <div className="mt-auto pt-1">
                                                    <span className="block text-sm font-bold text-gray-900">{formatRupiah(channel === 'online' ? product.harga_online : product.harga_offline)}</span>
                                                    {product.is_variant ? <span className="inline-block mt-1 text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">VARIAN</span> : <span className="text-[10px] text-gray-400">{product.stok} stok</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- KANAN: CART --- */}
                <div className={`fixed lg:static bottom-[75px] lg:bottom-0 inset-x-0 z-30 lg:z-auto bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] lg:shadow-none ${isCartExpanded ? 'h-[calc(100dvh-150px)] rounded-t-2xl' : 'h-[80px] rounded-t-xl lg:h-full lg:w-[380px] xl:w-[420px] lg:rounded-none'}`}>
                    <div className="w-full h-6 flex justify-center items-center lg:hidden cursor-pointer bg-white rounded-t-xl shrink-0" onClick={() => setIsCartExpanded(!isCartExpanded)}><div className="w-12 h-1.5 bg-gray-300 rounded-full"></div></div>
                    <div className="px-5 pb-2 lg:py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer lg:cursor-default shrink-0" onClick={() => window.innerWidth < 1024 && setIsCartExpanded(!isCartExpanded)}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ShoppingCartIcon className="w-6 h-6 text-gray-900" />
                                {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Keranjang</h3>
                                <p className="text-[10px] text-gray-500 lg:hidden">Total: <span className="font-bold text-gray-900">{formatRupiah(grandTotal)}</span></p>
                                <p className="text-[10px] text-gray-500 hidden lg:block">Review pesanan</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {cart.length > 0 && <button onClick={(e) => { e.stopPropagation(); if(confirm('Hapus semua?')) setCart([]); }} className="text-xs text-gray-400 hover:text-red-600 px-2 py-1 rounded font-medium hidden lg:block">Reset</button>}
                            <div className="lg:hidden text-gray-400">{isCartExpanded ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}</div>
                        </div>
                    </div>

                    <div className={`flex-1 overflow-y-auto p-5 space-y-4 bg-white hide-scroll ${!isCartExpanded && 'hidden lg:block'}`}>
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-60">
                                <ShoppingCartIcon className="w-10 h-10 mb-2 stroke-1 opacity-50" />
                                <p className="text-xs font-medium">Keranjang kosong</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartItemId} className="flex gap-3 py-2 border-b border-gray-50 last:border-0 items-start group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-gray-900 truncate leading-snug">{item.nama_produk}</h4>
                                            <button onClick={() => removeFromCart(item.cartItemId)} className="text-gray-300 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.variantName && <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">{item.variantName}</span>}
                                            <span className="text-[11px] text-gray-500">@ {formatRupiah(channel === 'online' ? item.harga_online : item.harga_offline)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center h-8 bg-white border border-gray-200 rounded-lg shadow-sm">
                                        <button onClick={() => updateQty(item.cartItemId, -1)} className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-l-lg transition-colors border-r border-gray-100"><MinusIcon className="w-3 h-3" /></button>
                                        <span className="text-xs font-bold text-gray-900 w-8 text-center">{item.qty}</span>
                                        <button onClick={() => updateQty(item.cartItemId, 1)} className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg transition-colors border-l border-gray-100"><PlusIcon className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className={`p-5 bg-gray-50 border-t border-gray-200 shrink-0 ${!isCartExpanded && 'hidden lg:block'}`}>
                        <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span className="font-medium text-gray-900">{formatRupiah(subtotal)}</span></div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>Diskon</span>
                                <div className="flex items-center w-24 bg-white border border-gray-200 rounded-md px-2 h-7 focus-within:border-black transition-colors">
                                    <span className="text-gray-400 mr-1">-</span>
                                    <input type="number" className="w-full border-none p-0 text-right text-xs font-bold text-red-500 focus:ring-0 placeholder-gray-300" placeholder="0" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="font-bold text-sm text-gray-900">Total Tagihan</span>
                                <span className="font-black text-xl text-black">{formatRupiah(grandTotal)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rp</span>
                                <input type="number" className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${paymentMethod === 'cash' ? 'bg-white border-gray-300 focus:ring-1 focus:ring-black text-gray-900' : 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed'}`} placeholder="Uang diterima..." value={customerMoney || ''} onChange={(e) => setCustomerMoney(Number(e.target.value))} disabled={paymentMethod !== 'cash'} />
                            </div>
                            {paymentMethod === 'cash' && (
                                <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
                                    {quickAmounts.map(amt => (
                                        <button key={amt} onClick={() => setCustomerMoney(amt)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-black hover:text-black transition-all flex-shrink-0 active:scale-95">{amt/1000}k</button>
                                    ))}
                                    <button onClick={() => setCustomerMoney(grandTotal)} className="px-3 py-1.5 bg-gray-200 border border-transparent rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-300 transition-all flex-shrink-0 active:scale-95">Pas</button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {[{id:'cash',l:'Cash',i:BanknotesIcon}, {id:'debit',l:'Debit',i:CreditCardIcon}, {id:'qr',l:'QRIS',i:DevicePhoneMobileIcon}].map(m => (
                                <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all ${paymentMethod === m.id ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                                    <m.i className="w-4 h-4 mb-1" />
                                    <span className="text-[10px] font-bold uppercase">{m.l}</span>
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'cash' && (<div className="flex justify-between items-center mt-3 text-xs"><span className="text-gray-500">Kembalian</span><span className={`font-bold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatRupiah(change)}</span></div>)}

                        <button disabled={cart.length === 0 || (paymentMethod === 'cash' && customerMoney < grandTotal) || isProcessing} onClick={handleFinalize} className="w-full mt-4 py-3.5 bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-400/30 hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                            {isProcessing ? 'Memproses...' : <><PrinterIcon className="w-4 h-4" /> Proses & Cetak</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL VARIAN --- */}
            {showVariantModal && selectedProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 no-print">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative">
                        <button onClick={() => setShowVariantModal(false)} className="absolute top-4 right-4 p-1 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"><XMarkIcon className="w-5 h-5"/></button>
                        <h3 className="font-bold text-lg text-gray-900 mb-1 pr-8">{selectedProduct.nama_produk}</h3>
                        <p className="text-xs text-gray-500 mb-4">Pilih varian:</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto hide-scroll">
                            {selectedProduct.variants.map(v => (
                                <button key={v.id} onClick={() => addToCart(selectedProduct, v)} disabled={v.stok <= 0} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-black transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                            {/* Fix Variant Image */}
                                            {v.gambar ? <img src={v.gambar.startsWith('http') ? v.gambar : `/storage/${v.gambar}`} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-400">{v.name.charAt(0)}</span>}
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-bold text-gray-800 group-hover:text-black">{v.name}</span>
                                            <span className={`block text-[10px] ${v.stok > 0 ? 'text-gray-500' : 'text-red-500 font-bold'}`}>{v.stok > 0 ? `Stok: ${v.stok}` : 'Habis'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs font-bold text-gray-900">{formatRupiah(channel === 'online' ? v.harga_online : v.harga_offline)}</span>
                                        {v.stok > 0 && <PlusIcon className="w-4 h-4 text-gray-300 group-hover:text-black ml-auto mt-1" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL STRUK UNTUK DILIHAT (VIEW ONLY) --- */}
            {/* Class no-print agar modal ini TIDAK ikut ke-print */}
            {showReceipt && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
                    <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-gray-100 relative">
                        <div className="p-8 overflow-y-auto flex-1 hide-scroll">
                            <div className="text-center mb-6">
                                <img src="/images/logo-houston.png" alt="Logo Houston" className="h-16 w-auto mx-auto mb-3 object-contain" />
                                <h2 className="font-bold text-lg text-gray-900 uppercase leading-tight">{toko?.nama_toko || auth.user.name}</h2>
                                {toko?.cabang && <p className="text-xs font-semibold text-gray-600 mt-0.5 uppercase">{toko.cabang}</p>}
                                <div className="text-[10px] text-gray-500 mt-2 space-y-0.5">
                                    <p className="flex items-center justify-center gap-1 leading-tight">{toko?.alamat || 'Alamat Belum Diatur'}</p>
                                    <p className="flex items-center justify-center gap-1 font-mono">No. Telp {toko?.no_hp || '-'}</p>
                                </div>
                            </div>
                            <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-1 text-[10px] text-gray-600 font-mono">
                                <div className="flex justify-between"><span>NO. TRX</span><span className="font-bold text-gray-900 uppercase">{transactionCode}</span></div>
                                <div className="flex justify-between"><span>TANGGAL</span><span>{new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span></div>
                                <div className="flex justify-between"><span>KASIR</span><span className="uppercase">{auth.user.name}</span></div>
                                <div className="flex justify-between"><span>METODE</span><span className="uppercase font-bold">{paymentMethod}</span></div>
                            </div>
                            <div className="space-y-3 mb-6">
                                {cart.map(item => (
                                    <div key={item.cartItemId} className="text-xs font-mono border-b border-gray-50 pb-2 last:border-0">
                                        <div className="flex justify-between font-bold text-gray-900">
                                            <span>{item.nama_produk} {item.variantName ? `(${item.variantName})` : ''}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-500 mt-0.5">
                                            <span>{item.qty} x {formatRupiah(channel === 'online' ? item.harga_online : item.harga_offline)}</span>
                                            <span className="text-gray-900 font-bold">{formatRupiah((channel === 'online' ? item.harga_online : item.harga_offline) * item.qty)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-300 pt-3 space-y-1 text-xs font-mono">
                                <div className="flex justify-between text-gray-600"><span>SUBTOTAL</span><span>{formatRupiah(subtotal)}</span></div>
                                {discount > 0 && <div className="flex justify-between text-red-600"><span>DISKON</span><span>-{formatRupiah(discount)}</span></div>}
                                <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-dashed border-gray-300 mt-2">
                                    <span>TOTAL</span>
                                    <span className="text-base">{formatRupiah(grandTotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 pt-1"><span>BAYAR</span><span>{formatRupiah(customerMoney)}</span></div>
                                <div className="flex justify-between text-gray-900 font-bold"><span>KEMBALI</span><span>{formatRupiah(change)}</span></div>
                            </div>
                            <div className="text-center mt-8 space-y-1">
                                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">*** TERIMA KASIH ***</p>
                                <p className="text-[8px] text-gray-400">Barang yang dibeli tidak dapat ditukar</p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={resetTransaction} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-white transition-colors">Tutup</button>
                            <button onClick={handlePrint} className="flex-1 py-2.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"><PrinterIcon className="w-4 h-4"/> Cetak</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- STRUK UNTUK DI-PRINT (HIDDEN ON SCREEN, VISIBLE ON PRINT) --- */}
            {/* PENTING: Ini ada di LUAR modal, agar tidak terkena CSS modal yang fixed */}
            {showReceipt && (
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
                                    No. Telp {toko?.no_hp || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-b border-dashed border-gray-300 py-3 mb-4 space-y-1 text-[10px] text-gray-600 font-mono">
                            <div className="flex justify-between"><span>NO. TRX</span><span className="font-bold text-gray-900 uppercase">{transactionCode}</span></div>
                            <div className="flex justify-between"><span>TANGGAL</span><span>{new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span></div>
                            <div className="flex justify-between"><span>KASIR</span><span className="uppercase">{auth.user.name}</span></div>
                            <div className="flex justify-between"><span>METODE</span><span className="uppercase font-bold">{paymentMethod}</span></div>
                        </div>

                        {/* Items */}
                        <div className="space-y-3 mb-6">
                            {cart.map(item => (
                                <div key={item.cartItemId} className="text-xs font-mono border-b border-gray-50 pb-2 last:border-0">
                                    <div className="flex justify-between font-bold text-gray-900">
                                        <span>{item.nama_produk} {item.variantName ? `(${item.variantName})` : ''}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500 mt-0.5">
                                        <span>{item.qty} x {formatRupiah(channel === 'online' ? item.harga_online : item.harga_offline)}</span>
                                        <span className="text-gray-900 font-bold">{formatRupiah((channel === 'online' ? item.harga_online : item.harga_offline) * item.qty)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-300 pt-3 space-y-1 text-xs font-mono">
                            <div className="flex justify-between text-gray-600"><span>SUBTOTAL</span><span>{formatRupiah(subtotal)}</span></div>
                            {discount > 0 && <div className="flex justify-between text-red-600"><span>DISKON</span><span>-{formatRupiah(discount)}</span></div>}

                            <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-dashed border-gray-300 mt-2">
                                <span>TOTAL</span>
                                <span className="text-base">{formatRupiah(grandTotal)}</span>
                            </div>

                            <div className="flex justify-between text-gray-600 pt-1"><span>BAYAR</span><span>{formatRupiah(customerMoney)}</span></div>
                            <div className="flex justify-between text-gray-900 font-bold"><span>KEMBALI</span><span>{formatRupiah(change)}</span></div>
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
