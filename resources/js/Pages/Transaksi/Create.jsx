import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, usePage } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import {
    FiSearch, FiShoppingCart, FiTrash2, FiCreditCard,
    FiSmartphone, FiDollarSign, FiPlus, FiMinus,
    FiBox, FiX, FiPrinter, FiChevronUp, FiChevronDown,
    FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import axios from 'axios';

// Helper Format Currency (Untuk Tampilan Label)
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
};

// Helper Format Input (Untuk Input Field)
const formatRibuan = (val) => {
    if (!val && val !== 0) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseRibuan = (val) => {
    if (!val) return 0;
    return parseInt(val.replace(/\./g, ''), 10) || 0;
};

export default function Create({ auth, products }) {
    const { props } = usePage();

    // --- 1. STATE MANAGEMENT ---
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [channel, setChannel] = useState('offline');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    
    const [discount, setDiscount] = useState(0);
    const [customerMoney, setCustomerMoney] = useState(0);
    
    // State tampilan (string dengan titik)
    const [displayDiscount, setDisplayDiscount] = useState('');
    const [displayMoney, setDisplayMoney] = useState('');

    const [showReceipt, setShowReceipt] = useState(false);
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [transactionId, setTransactionId] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [imageErrors, setImageErrors] = useState({});

    // --- EFFECT: Sinkronisasi Display Input dengan State Number ---
    useEffect(() => {
        setDisplayDiscount(discount === 0 ? '' : formatRibuan(discount));
    }, [discount]);

    useEffect(() => {
        if (paymentMethod !== 'cash') {
             setDisplayMoney(formatRibuan(customerMoney));
        }
    }, [customerMoney, paymentMethod]);


    // --- 2. LOGIC GAMBAR ---
    const handleImageError = (productId) => {
        setImageErrors(prev => ({ ...prev, [productId]: true }));
    };

    // --- 3. FILTER PRODUCTS ---
    const filteredProducts = products.filter(p =>
        p.nama_produk.toLowerCase().includes(search.toLowerCase()) ||
        p.kategori?.toLowerCase().includes(search.toLowerCase())
    );

    // --- 4. LOGIC KERANJANG & VARIAN ---
    const handleProductClick = (product) => {
        // Cek stok total (opsional, tergantung kebutuhan bisnis)
        const totalStock = product.stok + (product.variants ? product.variants.reduce((a, b) => a + b.stok, 0) : 0);
        
        // Validasi jika semua stok habis
        if (totalStock <= 0) { 
            showAlert('Stok produk habis', 'error'); 
            return; 
        }

        if (product.variants && product.variants.length > 0) {
            // REVISI: Langsung set produk yang dipilih tanpa menambah opsi 'Produk Utama'
            setSelectedProduct(product);
            setShowVariantModal(true);
        } else {
            // Produk tanpa varian
            if (product.stok <= 0) { 
                showAlert('Stok produk habis', 'error'); 
                return; 
            }
            addToCart(product, null);
        }
    };

    const addToCart = (product, variant) => {
        const variantId = variant ? variant.id : null;
        const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}`;
        
        // Tentukan stok yang akan dicek (Stok Varian atau Stok Produk Induk)
        const availableStock = variant ? variant.stok : product.stok;
        
        const existing = cart.find(item => item.cartItemId === cartItemId);
        const currentQty = existing ? existing.qty : 0;

        if (currentQty >= availableStock) { 
            showAlert(`Stok tidak mencukupi. Tersedia: ${availableStock}`, 'error'); 
            return; 
        }

        if (existing) {
            setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, {
                ...product, 
                cartItemId, 
                variantId,
                variantName: variant ? variant.name : null, // variant.name berasal dari DB (nama_varian)
                qty: 1, 
                stok: availableStock,
                harga_online: variant ? variant.harga_online : product.harga_online,
                harga_offline: variant ? variant.harga_offline : product.harga_offline,
                // Prioritas gambar: Gambar Varian -> Gambar Produk -> null
                gambar_utama: variant && variant.gambar ? variant.gambar : product.gambar_utama
            }]);
        }
        setShowVariantModal(false);
        showAlert('Produk ditambahkan ke keranjang', 'success');
    };

    const updateQty = (cartItemId, delta) => {
        setCart(cart.map(item => {
            if (item.cartItemId === cartItemId) {
                const newQty = item.qty + delta;
                if (newQty > item.stok) { showAlert(`Stok tidak mencukupi. Tersedia: ${item.stok}`, 'error'); return item; }
                if (newQty < 1) return null;
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item !== null));
    };

    const removeFromCart = (cartItemId) => setCart(cart.filter(item => item.cartItemId !== cartItemId));


    // --- 5. KALKULASI & SYNC DATA ---
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => {
            const harga = channel === 'online' ? item.harga_online : item.harga_offline;
            return acc + (harga * item.qty);
        }, 0);
    }, [cart, channel]);

    const grandTotal = Math.max(0, subtotal - discount);
    
    useEffect(() => {
        if (paymentMethod !== 'cash') {
            setCustomerMoney(grandTotal);
            setDisplayMoney(formatRibuan(grandTotal));
        }
    }, [grandTotal, paymentMethod]);

    const change = useMemo(() => {
        return paymentMethod === 'cash' && customerMoney >= grandTotal ? customerMoney - grandTotal : 0;
    }, [customerMoney, grandTotal, paymentMethod]);

    const quickAmounts = [50000, 100000, 200000, 500000];

    // Handle Change Input Diskon
    const handleChangeDiscount = (e) => {
        const rawVal = e.target.value.replace(/\./g, '');
        if (!isNaN(rawVal)) {
            const val = parseInt(rawVal || 0, 10);
            setDiscount(val);
            setDisplayDiscount(formatRibuan(rawVal));
        }
    };

    // Handle Change Input Bayar
    const handleChangeMoney = (e) => {
        const rawVal = e.target.value.replace(/\./g, '');
        if (!isNaN(rawVal)) {
            const val = parseInt(rawVal || 0, 10);
            setCustomerMoney(val);
            setDisplayMoney(formatRibuan(rawVal));
        }
    };

    // --- 6. ALERT SYSTEM ---
    const showAlert = (message, type = 'info') => {
        setAlertMessage({ message, type });
        setTimeout(() => setAlertMessage(null), 3000);
    };

    // --- 7. PROSES TRANSAKSI ---
    const handleFinalize = async () => {
        if (cart.length === 0) { showAlert('Keranjang masih kosong', 'error'); return; }
        if (paymentMethod === 'cash' && customerMoney < grandTotal) { showAlert('Uang pembayaran tidak mencukupi', 'error'); return; }

        setIsProcessing(true);
        const transactionData = {
            cart: cart.map(item => ({ id: item.id, variantId: item.variantId, qty: item.qty })),
            channel, paymentMethod, discount,
            customerMoney: paymentMethod === 'cash' ? customerMoney : grandTotal
        };

        try {
            const response = await axios.post(route('transaksi.store'), transactionData);
            if (response.data.success) {
                setTransactionId(response.data.transaksi_id);
                setShowReceipt(true);
                showAlert('Transaksi berhasil diproses', 'success');
            } else {
                showAlert(response.data.message || 'Transaksi gagal', 'error');
            }
        } catch (error) {
            console.error('Transaction error:', error);
            showAlert('Terjadi kesalahan saat memproses transaksi', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetTransaction = () => {
        setCart([]); setDiscount(0); setCustomerMoney(0);
        setDisplayDiscount(''); setDisplayMoney('');
        setShowReceipt(false); setIsCartExpanded(false); setChannel('offline'); setPaymentMethod('cash');
    };

    return (
        <GeneralLayout>
            <Head title="Kasir - Manajemen Stok" />
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100% !important; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                }
            `}} />

            {/* Alert */}
            {alertMessage && (
                <div className={`fixed top-4 right-4 z-[200] animate-in slide-in-from-top duration-300 ${alertMessage.type === 'error' ? 'bg-red-500' : alertMessage.type === 'success' ? 'bg-green-500' : 'bg-blue-500'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md`}>
                    {alertMessage.type === 'error' ? <FiAlertCircle size={20} /> : <FiCheckCircle size={20} />}
                    <span className="font-bold text-sm">{alertMessage.message}</span>
                </div>
            )}

            <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] md:h-[calc(100vh-120px)] overflow-hidden font-sans text-slate-800 bg-white rounded-[2rem] shadow-sm border border-gray-100">
                {/* --- SISI KIRI: KATALOG --- */}
                <div className="flex-grow flex flex-col h-full overflow-hidden border-r border-slate-100 print:hidden">
                    <header className="bg-white p-4 flex flex-col sm:flex-row gap-4 justify-between items-center z-20 border-b border-slate-100">
                        <div className="flex bg-slate-100 rounded-2xl p-1 w-full sm:w-auto border border-slate-200/50">
                            <button onClick={() => setChannel('offline')} className={`flex-1 px-6 py-2 text-[10px] font-black rounded-xl transition-all duration-300 ${channel === 'offline' ? 'bg-black text-white shadow-lg' : 'text-slate-400'}`}>OFFLINE</button>
                            <button onClick={() => setChannel('online')} className={`flex-1 px-6 py-2 text-[10px] font-black rounded-xl transition-all duration-300 ${channel === 'online' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>ONLINE</button>
                        </div>
                        <div className="relative group w-full sm:w-64">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input type="text" placeholder="Cari produk..." className="w-full bg-slate-50 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-black transition-all shadow-inner" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </header>

                    <div className="p-6 overflow-y-auto flex-grow space-y-6 no-scrollbar pb-32 lg:pb-6">
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-20 text-slate-400"><FiBox size={48} className="mx-auto mb-4 opacity-20" /><p className="font-bold">Produk tidak ditemukan</p></div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {filteredProducts.map(product => {
                                    const hasError = imageErrors[product.id];
                                    return (
                                        <div key={product.id} onClick={() => handleProductClick(product)} className={`bg-white p-4 rounded-[2rem] border transition-all duration-300 cursor-pointer group flex flex-col active:scale-95 shadow-sm ${product.stok <= 0 && !product.is_variant ? 'border-red-200 opacity-50' : 'border-slate-100 hover:border-black'}`}>
                                            <div className="aspect-square bg-slate-50 rounded-[1.5rem] mb-4 overflow-hidden flex items-center justify-center text-slate-200 group-hover:bg-slate-100 transition-colors relative">
                                                {product.gambar_utama && !hasError ? (<img src={`/storage/${product.gambar_utama}`} alt={product.nama_produk} className="w-full h-full object-contain p-2 mix-blend-multiply group-hover:scale-110 transition-transform duration-500" onError={() => handleImageError(product.id)} loading="lazy" />) : (<div className="flex flex-col items-center justify-center text-slate-300"><FiBox size={32} className="opacity-20" /></div>)}
                                                {product.stok <= 0 && !product.is_variant && (<div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center"><span className="bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">HABIS</span></div>)}
                                            </div>
                                            <h4 className="font-bold text-xs text-slate-900 truncate leading-tight mb-1 uppercase tracking-tight">{product.nama_produk}</h4>
                                            <div className="flex justify-between items-end mt-auto">
                                                <span className="font-[900] text-sm text-slate-900 leading-none">{formatRupiah(channel === 'online' ? product.harga_online : product.harga_offline)}</span>
                                                {product.is_variant ? <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">VARIAN</span> : <span className="text-[10px] font-bold text-slate-300 italic">{product.stok} {product.satuan}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- SISI KANAN: KERANJANG --- */}
                <div className={`fixed lg:static inset-x-0 bottom-0 z-40 bg-white border-l border-slate-100 flex flex-col transition-all mb-11 duration-700 ease-in-out print:hidden ${isCartExpanded ? 'h-[85vh]' : 'h-[80px] lg:h-full lg:w-[400px] xl:w-[450px]'}`}>
                    {/* ... (Bagian Keranjang sama persis) ... */}
                    <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center cursor-pointer lg:cursor-default shrink-0" onClick={() => window.innerWidth < 1024 && setIsCartExpanded(!isCartExpanded)}>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200"><FiShoppingCart size={18} /></div>
                            <div><h3 className="font-black text-xs italic uppercase tracking-tighter">Order List</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.length} Items</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); if (cart.length > 0 && confirm('Hapus semua item?')) setCart([]); }} className="lg:flex hidden text-red-500 hover:bg-red-50 p-2 rounded-xl active:scale-90"><FiTrash2 size={18} /></button>
                            <div className="lg:hidden text-slate-300 animate-bounce">{isCartExpanded ? <FiChevronDown size={20} /> : <FiChevronUp size={20} />}</div>
                        </div>
                    </div>

                    <div className={`flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar ${!isCartExpanded && 'hidden lg:block'}`}>
                        {cart.length === 0 ? (
                            <div className="text-center py-20 text-slate-300"><FiShoppingCart size={48} className="mx-auto mb-4 opacity-20" /><p className="font-bold text-sm">Keranjang Kosong</p></div>
                        ) : (
                            cart.map(item => (
                                <div key={item.cartItemId} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100 group">
                                    <div className="max-w-[60%]">
                                        <p className="text-xs font-[900] text-slate-900 leading-tight truncate uppercase tracking-tight">{item.nama_produk}</p>
                                        {item.variantName && <p className="text-[9px] text-blue-600 font-bold uppercase mt-0.5 tracking-wider">Varian: {item.variantName}</p>}
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 italic uppercase tracking-tighter">@ {formatRupiah(channel === 'online' ? item.harga_online : item.harga_offline)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                                            <button onClick={() => updateQty(item.cartItemId, -1)} className="text-red-500 p-1 hover:bg-red-50 rounded"><FiMinus size={12} /></button>
                                            <span className="text-xs font-black min-w-[20px] text-center">{item.qty}</span>
                                            <button onClick={() => updateQty(item.cartItemId, 1)} className="text-blue-500 p-1 hover:bg-blue-50 rounded"><FiPlus size={12} /></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.cartItemId)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 text-[8px] font-bold uppercase">Hapus</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className={`p-6 md:p-8 bg-slate-50/80 backdrop-blur-lg border-t border-slate-200 lg:rounded-none rounded-t-[2.5rem] space-y-4 shadow-inner ${!isCartExpanded && 'hidden lg:block'}`}>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm focus-within:border-black transition-colors">
                                <label className="text-[9px] font-black text-slate-300 uppercase block mb-1">Diskon (Rp)</label>
                                <input type="text" inputMode="numeric" className="w-full bg-transparent border-none p-0 font-black text-sm focus:ring-0" value={displayDiscount} onChange={handleChangeDiscount} placeholder="0" />
                            </div>
                            <div className={`bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-colors ${paymentMethod !== 'cash' ? 'opacity-100 bg-slate-50' : 'focus-within:border-blue-600'}`}>
                                <label className="text-[9px] font-black text-blue-400 uppercase block mb-1 tracking-widest">Bayar (Rp)</label>
                                <input type="text" inputMode="numeric" className="w-full bg-transparent border-none p-0 font-black text-sm focus:ring-0 text-blue-600 disabled:text-blue-600 disabled:opacity-100 disabled:cursor-not-allowed" value={displayMoney} onChange={handleChangeMoney} placeholder="0" disabled={paymentMethod !== 'cash'} />
                            </div>
                        </div>

                        <div className={`flex gap-2 overflow-x-auto no-scrollbar py-1 transition-all duration-300 ${paymentMethod === 'cash' ? 'opacity-100 max-h-12' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                            {quickAmounts.map(amount => (
                                <button key={amount} onClick={() => { setCustomerMoney(amount); setDisplayMoney(formatRibuan(amount)); }} className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black hover:bg-black hover:text-white transition-all shadow-sm">+{amount / 1000}K</button>
                            ))}
                            <button onClick={() => { setCustomerMoney(grandTotal); setDisplayMoney(formatRibuan(grandTotal)); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black shadow-lg shadow-blue-200 active:scale-95 transition-transform">PAS</button>
                        </div>

                        <div className="pt-2 border-t border-slate-200 space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase italic"><span>Subtotal</span><span className="text-slate-900">{formatRupiah(subtotal)}</span></div>
                            {discount > 0 && (<div className="flex justify-between items-center text-[10px] font-black text-red-500 uppercase italic"><span>Diskon</span><span>- {formatRupiah(discount)}</span></div>)}
                            <div className="flex justify-between items-center font-black text-lg italic tracking-tighter uppercase text-slate-400 pt-2 border-t border-slate-100"><span>Grand Total</span><span className="text-black text-3xl font-[900] tracking-tighter italic leading-none">{formatRupiah(grandTotal)}</span></div>
                            {paymentMethod === 'cash' && customerMoney > 0 && (<div className="flex justify-between items-center text-[10px] font-black uppercase italic pt-2"><span className={change >= 0 ? 'text-green-600' : 'text-red-500'}>Kembalian</span><span className={change >= 0 ? 'text-green-600 font-[900]' : 'text-red-500 font-bold'}>{formatRupiah(change)}</span></div>)}
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2">
                            {[{ id: 'cash', label: 'CASH', icon: FiDollarSign }, { id: 'debit', label: 'DEBIT', icon: FiCreditCard }, { id: 'qr', label: 'QRIS', icon: FiSmartphone }].map(method => (
                                <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`flex flex-col items-center py-3 rounded-[1.2rem] border-2 transition-all duration-300 ${paymentMethod === method.id ? 'bg-black text-white border-black shadow-2xl scale-105' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'}`}><method.icon size={18} /><span className="text-[8px] font-black tracking-widest uppercase mt-1.5">{method.label}</span></button>
                            ))}
                        </div>

                        <button disabled={cart.length === 0 || (paymentMethod === 'cash' && customerMoney < grandTotal) || isProcessing} onClick={handleFinalize} className={`w-full py-5 rounded-[2rem] font-black text-sm tracking-[0.1em] transition-all duration-500 shadow-sm ${cart.length === 0 || (paymentMethod === 'cash' && customerMoney < grandTotal) || isProcessing ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-black text-white hover:bg-slate-800 active:scale-95 shadow-black/20'}`}>{isProcessing ? 'MEMPROSES...' : paymentMethod === 'cash' && customerMoney < grandTotal && cart.length > 0 ? 'UANG KURANG' : 'PROSES TRANSAKSI'}</button>
                    </div>

                    <div className={`lg:hidden flex justify-between items-center px-8 py-4 h-[80px] shrink-0 ${isCartExpanded && 'hidden'}`} onClick={() => setIsCartExpanded(true)}>
                        <h4 className="font-black text-xl tracking-tighter italic text-black leading-none">{formatRupiah(grandTotal)}</h4>
                        <div className="bg-black text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-black/20">Review Cart</div>
                    </div>
                </div>
            </div>

            {/* --- MODAL PILIH VARIAN (REVISI: Hanya Menampilkan Varian Saja) --- */}
            {showVariantModal && selectedProduct && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-[900] text-xl leading-tight uppercase italic text-slate-900">{selectedProduct.nama_produk}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Pilih Varian Produk</p>
                            </div>
                            <button onClick={() => setShowVariantModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><FiX /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {/* REVISI: Menggunakan selectedProduct.variants secara langsung */}
                            {selectedProduct.variants.map((variant, index) => (
                                <button 
                                    key={variant.id || index}
                                    onClick={() => addToCart(selectedProduct, variant)} 
                                    disabled={variant.stok <= 0} 
                                    className={`flex items-center justify-between gap-4 p-4 rounded-2xl border-2 transition-all group text-left ${variant.stok <= 0 ? 'border-slate-100 opacity-50 cursor-not-allowed' : 'border-slate-50 hover:border-black active:scale-95'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                                            {variant.gambar || selectedProduct.gambar_utama ? (
                                                <img 
                                                    src={`/storage/${variant.gambar || selectedProduct.gambar_utama}`} 
                                                    alt={variant.name} 
                                                    className="w-full h-full object-cover" 
                                                    onError={(e) => {e.target.style.display='none'}}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <FiBox size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {/* Nama Varian Langsung */}
                                            <span className="block font-black text-xs uppercase tracking-tight group-hover:translate-x-1 transition-transform text-slate-900">
                                                {variant.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-400 font-bold">Stok: {variant.stok}</p>
                                        <p className="text-xs font-black text-slate-900">Rp {(channel === 'online' ? variant.harga_online : variant.harga_offline).toLocaleString()}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL STRUK (TETAP SAMA) --- */}
            {showReceipt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:bg-white print:p-0 print:static transition-all">
                    <div className="print-area bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 print:shadow-none print:w-full print:rounded-none">
                        <div className="p-8 space-y-6 text-slate-800">
                            <div className="text-center space-y-1"><h2 className="font-[900] text-2xl italic tracking-tighter uppercase leading-none">{auth.user.name || 'Toko Saya'}</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] italic">Struk Pembayaran</p><div className="border-b border-dashed border-slate-200 pt-4"></div></div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase space-y-1 tracking-tight">
                                <div className="flex justify-between"><span>No. Transaksi</span><span className="text-slate-900">#{transactionId}</span></div>
                                <div className="flex justify-between font-black text-blue-600 tracking-widest italic"><span>Channel</span><span>{channel.toUpperCase()}</span></div>
                                <div className="flex justify-between"><span>Kasir</span><span className="text-slate-900">{auth.user.name}</span></div>
                                <div className="flex justify-between"><span>Tanggal</span><span className="text-slate-900 italic font-medium">{new Date().toLocaleString('id-ID')}</span></div>
                            </div>
                            <div className="border-b border-dashed border-slate-200"></div>
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.cartItemId} className="text-xs font-bold leading-tight uppercase tracking-tight text-slate-700">
                                        <div className="flex justify-between mb-1"><span className="max-w-[70%]">{item.nama_produk} {item.variantName && `(${item.variantName})`}</span><span>{formatRupiah(item.qty * (channel === 'online' ? item.harga_online : item.harga_offline))}</span></div>
                                        <p className="text-[9px] text-slate-400 italic lowercase">{item.qty} x {formatRupiah(channel === 'online' ? item.harga_online : item.harga_offline)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-b border-dashed border-slate-200 pt-2"></div>
                            <div className="space-y-1 text-xs font-bold uppercase tracking-widest text-slate-500">
                                <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                                {discount > 0 && (<div className="flex justify-between text-red-500 italic"><span>Diskon</span><span>- {formatRupiah(discount)}</span></div>)}
                                <div className="flex justify-between font-[900] text-2xl pt-4 italic text-black leading-none border-t border-slate-100 tracking-tighter uppercase"><span>Total</span><span>{formatRupiah(grandTotal)}</span></div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-[1.5rem] space-y-1 border border-slate-100">
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase italic tracking-[0.2em]"><span>Metode Bayar</span><span className="text-slate-900">{paymentMethod.toUpperCase()}</span></div>
                                {paymentMethod === 'cash' && (<><div className="flex justify-between text-[10px] font-black text-slate-400 border-t border-slate-200 pt-2 mt-1"><span>Tunai</span><span className="text-slate-900">{formatRupiah(customerMoney)}</span></div><div className="flex justify-between text-[10px] font-black border-t border-slate-200 pt-2 mt-1 font-[900] tracking-widest uppercase italic leading-none"><span className="text-green-600">Kembali</span><span className="text-green-600 text-sm font-sans tracking-normal">{formatRupiah(change)}</span></div></>)}
                            </div>
                            <div className="text-center pt-4 italic text-slate-300 text-[10px] font-bold uppercase tracking-widest">*** Terima Kasih ***</div>
                        </div>
                        <div className="bg-slate-50 p-6 flex gap-3 border-t border-slate-100 no-print">
                            <button onClick={resetTransaction} className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:text-red-500 hover:border-red-100 transition-all tracking-widest active:scale-95"><FiX size={14} className="inline mr-1" /> Tutup</button>
                            <button onClick={() => window.print()} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 tracking-widest active:scale-95 shadow-black/20"><FiPrinter size={14} /> Cetak Struk</button>
                        </div>
                    </div>
                </div>
            )}
        </GeneralLayout>
    );
}