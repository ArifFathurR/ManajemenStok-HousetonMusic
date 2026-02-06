import { Head, Link } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import {
    MagnifyingGlassIcon, ShoppingCartIcon, TrashIcon, CreditCardIcon,
    DevicePhoneMobileIcon, BanknotesIcon, PlusIcon, MinusIcon,
    CubeIcon, ArrowLeftIcon, XMarkIcon, PrinterIcon, ChevronUpIcon, ChevronDownIcon,
    TagIcon, Squares2X2Icon
} from '@heroicons/react/24/outline';

export default function Kasir({ auth, products }) {
    // --- 1. STATE MANAGEMENT ---
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [channel, setChannel] = useState('offline'); // online atau offline
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [discount, setDiscount] = useState(0);
    const [customerMoney, setCustomerMoney] = useState(0);
    const [showReceipt, setShowReceipt] = useState(false);
    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [transactionId, setTransactionId] = useState("");

    // State Modal Varian
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);

    // --- 2. DATA DUMMY ---
    const allProducts = products || [];

    // --- 3. FILTER LOGIC ---
    const filteredProducts = allProducts.filter(p =>
        p.nama_produk.toLowerCase().includes(search.toLowerCase())
    );

    // --- 4. CART LOGIC ---
    const handleProductClick = (product) => {
        if (product.variants && product.variants.length > 0) {
            setSelectedProduct(product);
            setShowVariantModal(true);
        } else {
            addToCart(product, null);
        }
    };

    const addToCart = (product, variant) => {
        const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}`;
        const existing = cart.find(item => item.cartItemId === cartItemId);

        if (existing) {
            setCart(cart.map(item =>
                item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            setCart([...cart, {
                ...product,
                cartItemId,
                variantName: variant ? variant.name : null,
                qty: 1
            }]);
        }
        setShowVariantModal(false);
    };

    const updateQty = (cartItemId, delta) => {
        setCart(cart.map(item =>
            item.cartItemId === cartItemId ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        ).filter(item => item.qty > 0));
    };

    // --- 5. CALCULATION ---
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + ((channel === 'online' ? item.harga_online : item.harga_offline) * item.qty), 0), [cart, channel]);
    const grandTotal = subtotal - discount;
    const change = Math.max(0, customerMoney - grandTotal);
    const quickAmounts = [50000, 100000, 200000];

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    // --- 6. HANDLERS ---
    const handleFinalize = () => {
        setTransactionId(`TRX-${Date.now().toString().slice(-6)}`);
        setShowReceipt(true);
    };

    const resetTransaction = () => {
        setCart([]); setDiscount(0); setCustomerMoney(0); setShowReceipt(false); setIsCartExpanded(false);
    };

    return (
        <div className="h-screen w-full bg-gray-50 font-sans flex overflow-hidden text-gray-900">
            <Head title="Kasir" />

            {/* Print Style */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-area { position: fixed; inset: 0; background: white; z-index: 9999; padding: 20px; width: 100%; height: 100%; }
                }
                .hide-scroll::-webkit-scrollbar { display: none; }
                .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            {/* =======================
                LEFT SIDE: CATALOG
               ======================= */}
            <div className="flex-1 flex flex-col h-full relative z-0 no-print border-r border-gray-200">

                {/* HEADER */}
                <header className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 leading-tight">Kasir</h1>
                            <p className="text-xs text-gray-500">Buat transaksi baru</p>
                        </div>
                    </div>

                    {/* CHANNEL SWITCHER (Pill Style) */}
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                            onClick={() => setChannel('offline')}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${channel === 'offline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Toko
                        </button>
                        <button
                            onClick={() => setChannel('online')}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${channel === 'online' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Online
                        </button>
                    </div>
                </header>

                {/* SEARCH BAR */}
                <div className="px-6 py-4 bg-white/50 backdrop-blur-sm">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama produk..."
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* PRODUCT GRID */}
                <div className="flex-1 overflow-y-auto px-6 pb-24 lg:pb-6 hide-scroll bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id}
                                onClick={() => handleProductClick(product)}
                                className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                            >
                                {/* Image Area */}
                                <div className="aspect-[4/3] bg-gray-100 relative flex items-center justify-center overflow-hidden">
                                    {product.gambar ? (
                                        <img src={`/storage/${product.gambar}`} alt={product.nama_produk} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : (
                                        <CubeIcon className="w-10 h-10 text-gray-300" />
                                    )}
                                    {product.variants.length > 0 && (
                                        <span className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Squares2X2Icon className="w-3 h-3" /> Varian
                                        </span>
                                    )}
                                </div>

                                {/* Content Area */}
                                <div className="p-3 flex flex-col flex-1">
                                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1 group-hover:text-indigo-600 transition-colors">
                                        {product.nama_produk}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-2">{product.kategori || 'Umum'}</p>

                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-900">
                                            {formatRupiah(channel === 'online' ? product.harga_online : product.harga_offline)}
                                        </span>
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <PlusIcon className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <MagnifyingGlassIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p className="text-sm">Produk tidak ditemukan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* =======================
                RIGHT SIDE: CART
               ======================= */}
            <div className={`
                fixed lg:static inset-x-0 bottom-0 z-50 bg-white border-l border-gray-200
                flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none no-print
                ${isCartExpanded ? 'h-[85vh] rounded-t-2xl' : 'h-[80px] lg:h-full lg:w-[380px] xl:w-[420px] rounded-none'}
            `}>

                {/* Mobile Handle */}
                <div className="lg:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setIsCartExpanded(!isCartExpanded)}>
                    <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                </div>

                {/* Cart Header */}
                <div
                    className="px-5 py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer lg:cursor-default"
                    onClick={() => window.innerWidth < 1024 && setIsCartExpanded(!isCartExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600 relative">
                            <ShoppingCartIcon className="w-5 h-5" />
                            {cart.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cart.length}</span>}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Keranjang</h2>
                            <p className="text-xs text-gray-500">{cart.length} item dipilih</p>
                        </div>
                    </div>
                    <div className="lg:hidden">
                        {isCartExpanded ? <ChevronDownIcon className="w-5 h-5 text-gray-400"/> : <ChevronUpIcon className="w-5 h-5 text-gray-400"/>}
                    </div>
                </div>

                {/* Cart List */}
                <div className={`flex-1 overflow-y-auto px-5 py-4 space-y-4 hide-scroll bg-white ${!isCartExpanded && 'hidden lg:block'}`}>
                    {cart.map(item => (
                        <div key={item.cartItemId} className="flex gap-3">
                            {/* Simple Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate">{item.nama_produk}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {item.variantName && (
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                            {item.variantName}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {formatRupiah(channel === 'online' ? item.harga_online : item.harga_offline)}
                                    </span>
                                </div>
                            </div>

                            {/* Qty Control (Small Pill) */}
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-1 py-1 border border-gray-200 h-fit">
                                <button onClick={() => updateQty(item.cartItemId, -1)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-all">
                                    <MinusIcon className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold text-gray-900 min-w-[1rem] text-center">{item.qty}</span>
                                <button onClick={() => updateQty(item.cartItemId, 1)} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-md transition-all">
                                    <PlusIcon className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <ShoppingCartIcon className="w-12 h-12 mb-2 stroke-1" />
                            <p className="text-sm">Keranjang kosong</p>
                        </div>
                    )}
                </div>

                {/* Checkout Section */}
                <div className={`p-5 bg-white border-t border-gray-100 ${!isCartExpanded && 'hidden lg:block'}`}>

                    {/* Summary */}
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-medium text-gray-900">{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Diskon</span>
                            <div className="flex items-center w-24 bg-gray-50 rounded-lg px-2 border border-gray-200">
                                <span className="text-xs text-gray-400 mr-1">-</span>
                                <input
                                    type="number"
                                    className="w-full bg-transparent border-none p-1 text-xs text-right focus:ring-0 text-red-500 font-medium placeholder-gray-300"
                                    value={discount || ''}
                                    onChange={e => setDiscount(Number(e.target.value))}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-lg text-indigo-600">{formatRupiah(grandTotal)}</span>
                        </div>
                    </div>

                    {/* Payment Inputs */}
                    <div className="space-y-3">
                        {/* Money Input */}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rp</span>
                            <input
                                type="number"
                                className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400"
                                placeholder="Nominal Uang..."
                                value={customerMoney || ''}
                                onChange={e => setCustomerMoney(Number(e.target.value))}
                            />
                        </div>

                        {/* Quick Amounts */}
                        <div className="flex gap-2 overflow-x-auto hide-scroll">
                            {quickAmounts.map(amt => (
                                <button key={amt} onClick={() => setCustomerMoney(amt)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all whitespace-nowrap">
                                    {amt/1000}k
                                </button>
                            ))}
                            <button onClick={() => setCustomerMoney(grandTotal)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all whitespace-nowrap">Uang Pas</button>
                        </div>

                        {/* Methods */}
                        <div className="grid grid-cols-3 gap-2">
                            {['cash', 'debit', 'qr'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setPaymentMethod(m)}
                                    className={`py-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1 transition-all ${
                                        paymentMethod === m
                                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {m === 'cash' && <BanknotesIcon className="w-3.5 h-3.5" />}
                                    {m === 'debit' && <CreditCardIcon className="w-3.5 h-3.5" />}
                                    {m === 'qr' && <DevicePhoneMobileIcon className="w-3.5 h-3.5" />}
                                    <span className="capitalize">{m}</span>
                                </button>
                            ))}
                        </div>

                        {/* Process Button */}
                        <button
                            onClick={handleFinalize}
                            disabled={cart.length === 0 || (paymentMethod === 'cash' && customerMoney < grandTotal)}
                            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <PrinterIcon className="w-4 h-4" />
                            Bayar & Cetak
                        </button>
                    </div>
                </div>
            </div>

            {/* =======================
                MODAL: VARIAN PRODUK
               ======================= */}
            {showVariantModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowVariantModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="w-5 h-5" />
                        </button>

                        <h3 className="font-bold text-lg text-gray-900 pr-8">{selectedProduct.nama_produk}</h3>
                        <p className="text-xs text-gray-500 mb-4">Pilih varian yang tersedia</p>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto hide-scroll">
                            {selectedProduct.variants.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => addToCart(selectedProduct, v)}
                                    disabled={v.stok === 0}
                                    className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                                            {v.name.substring(0, 1)}
                                        </span>
                                        <div className="text-left">
                                            <span className="block text-sm font-semibold text-gray-700 group-hover:text-indigo-700">{v.name}</span>
                                            <span className="block text-[10px] text-gray-400">Stok: {v.stok}</span>
                                        </div>
                                    </div>
                                    <PlusIcon className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* =======================
                MODAL: STRUK (RECEIPT)
               ======================= */}
            {showReceipt && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
                    <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl print:shadow-none print:w-full flex flex-col max-h-[90vh] print-area border border-gray-200">
                        {/* Scrollable Receipt Area */}
                        <div className="p-8 overflow-y-auto flex-1 hide-scroll">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white mb-2">
                                    <CubeIcon className="w-5 h-5" />
                                </div>
                                <h2 className="font-bold text-lg text-gray-900">HOUSTON MUSIC</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Official Receipt</p>
                            </div>

                            <div className="border-t border-b border-dashed border-gray-200 py-3 mb-4 space-y-1 text-xs">
                                <div className="flex justify-between"><span className="text-gray-500">ID</span><span className="font-mono text-gray-900">{transactionId}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span className="text-gray-900">{new Date().toLocaleDateString('id-ID')}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Metode</span><span className="uppercase text-gray-900">{paymentMethod}</span></div>
                            </div>

                            <div className="space-y-3 mb-4">
                                {cart.map(item => (
                                    <div key={item.cartItemId} className="text-xs">
                                        <div className="flex justify-between font-semibold text-gray-900">
                                            <span>{item.nama_produk} {item.variantName && `(${item.variantName})`}</span>
                                            <span>{formatRupiah((channel === 'online' ? item.harga_online : item.harga_offline) * item.qty)}</span>
                                        </div>
                                        <div className="text-gray-400 text-[10px] mt-0.5">
                                            {item.qty} x {formatRupiah(channel === 'online' ? item.harga_online : item.harga_offline)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
                                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                                <div className="flex justify-between text-red-500"><span>Diskon</span><span>-{formatRupiah(discount)}</span></div>
                                <div className="flex justify-between font-bold text-base text-gray-900 pt-2"><span>Total</span><span>{formatRupiah(grandTotal)}</span></div>
                                <div className="flex justify-between text-gray-500 pt-1"><span>Tunai</span><span>{formatRupiah(customerMoney)}</span></div>
                                <div className="flex justify-between text-green-600 font-semibold"><span>Kembali</span><span>{formatRupiah(change)}</span></div>
                            </div>

                            <div className="text-center mt-6">
                                <p className="text-[10px] text-gray-400">Terima kasih telah berbelanja!</p>
                            </div>
                        </div>

                        {/* Action Buttons (Hidden on Print) */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 no-print">
                            <button onClick={resetTransaction} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-white transition-colors">Tutup</button>
                            <button onClick={() => window.print()} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"><PrinterIcon className="w-4 h-4"/> Cetak</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
