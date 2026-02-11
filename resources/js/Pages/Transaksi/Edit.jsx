import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import {
    MagnifyingGlassIcon, ShoppingCartIcon, TrashIcon, CreditCardIcon,
    DevicePhoneMobileIcon, BanknotesIcon, PlusIcon, MinusIcon,
    CubeIcon, XMarkIcon, PrinterIcon, ChevronUpIcon, ChevronDownIcon,
    CheckCircleIcon, ExclamationCircleIcon, PhotoIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import Select from 'react-select';

export default function Edit({ auth, products, toko, transaksi, kategoris }) {
    // --- STATE ---
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [channel, setChannel] = useState('offline');
    const [paymentMethod, setPaymentMethod] = useState('cash');

    // State angka murni (untuk kalkulasi)
    const [discount, setDiscount] = useState(0);
    const [customerMoney, setCustomerMoney] = useState(0);

    // Split Payment State
    const [splitPayments, setSplitPayments] = useState([
        { method: 'cash', nominal: 0 },
        { method: 'debit', nominal: 0 }
    ]);

    const [isCartExpanded, setIsCartExpanded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [imageErrors, setImageErrors] = useState({});

    // Bonus Feature State
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [bonusSearch, setBonusSearch] = useState('');
    const [expandedBonusId, setExpandedBonusId] = useState(null);

    // --- INITIALIZATION ---
    useEffect(() => {
        if (transaksi) {
            setChannel(transaksi.channel);
            setPaymentMethod(transaksi.metode_pembayaran);
            setDiscount(parseFloat(transaksi.diskon_nominal));

            // Reconstruct Cart
            const loadedCart = transaksi.detail.map(d => {
                // Find product from props 'products' to get full data (including variants structure)
                const product = products.find(p => p.id === d.produk_id);

                if (!product) {
                    console.error(`Product ID ${d.produk_id} not found in props products`);
                    return null;
                }

                let matchedVariant = null;
                if (product.is_variant && product.variants) {
                    // 1. Try match by ID (New Feature)
                    if (d.varian_id) {
                        matchedVariant = product.variants.find(v => v.id === d.varian_id);
                    }

                    // 2. Fallback match by Price (Old Data)
                    if (!matchedVariant) {
                        matchedVariant = product.variants.find(v =>
                            (transaksi.channel === 'online' ? v.harga_online : v.harga_offline) == d.harga_satuan
                        ) || product.variants[0];
                    }
                }

                const cartItemId = matchedVariant
                    ? `${product.id}-${matchedVariant.id}${d.harga_satuan == 0 ? '-bonus' : ''}`
                    : `${product.id}${d.harga_satuan == 0 ? '-bonus' : ''}`;

                return {
                    id: product.id,
                    nama_produk: product.nama_produk,
                    kategori: product.kategori,
                    gambar_utama: matchedVariant ? matchedVariant.gambar : product.gambar_utama,
                    cartItemId: cartItemId,
                    variantId: matchedVariant ? matchedVariant.id : null,
                    variantName: matchedVariant ? matchedVariant.name : null,
                    qty: d.qty,
                    stok: (matchedVariant ? matchedVariant.stok : product.stok) + d.qty, // Kembalikan stok saat ini + qty yg sedang dipegang
                    harga_online: d.harga_satuan == 0 ? 0 : (matchedVariant ? matchedVariant.harga_online : product.harga_online),
                    harga_offline: d.harga_satuan == 0 ? 0 : (matchedVariant ? matchedVariant.harga_offline : product.harga_offline),
                    isBonus: d.harga_satuan == 0
                };
            }).filter(Boolean); // Remove nulls
            setCart(loadedCart);

            // Payments
            if (transaksi.metode_pembayaran === 'split') {
                if (transaksi.pembayaran && transaksi.pembayaran.length > 0) {
                    setSplitPayments(transaksi.pembayaran.map(p => ({
                        method: p.metode_pembayaran,
                        nominal: parseFloat(p.nominal)
                    })));
                }
            } else if (transaksi.metode_pembayaran === 'cash') {
                // Try to find customer money from payments if stored, else just total
                const cashPay = transaksi.pembayaran.find(p => p.metode_pembayaran === 'cash');
                setCustomerMoney(cashPay ? parseFloat(cashPay.nominal) : parseFloat(transaksi.grand_total));
            }
        }
    }, [transaksi]);

    // --- HELPERS ---
    const formatNumberWithDots = (val) => {
        if (val === 0 || !val) return '';
        return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleNumberInput = (setter) => (e) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        setter(Number(rawValue));
    };

    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

    const showAlert = (message, type = 'info') => {
        setAlertMessage({ message, type });
        setTimeout(() => setAlertMessage(null), 4000);
    };

    const handleImageError = (productId) => setImageErrors(prev => ({ ...prev, [productId]: true }));

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.nama_produk.toLowerCase().includes(search.toLowerCase()) ||
            (p.kategori && p.kategori.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = selectedCategory ? p.kategori === selectedCategory.label : true;

        return matchesSearch && matchesCategory;
    });

    // --- CART ACTIONS ---
    const handleProductClick = (product) => {
        // Find existing qty in cart to check against stock
        // For editing: The stock available is (Current DB Stock + Qty in Cart for this transaction)

        if (product.variants && product.variants.length > 0) {
            setSelectedProduct(product); setShowVariantModal(true);
        } else {
            // Calculate effective stock
            const inCart = cart.find(c => c.id === product.id && !c.variantId);
            const currentQtyInCart = inCart ? inCart.qty : 0;
            // Logic in addToCart will handle checks
            addToCart(product, null);
        }
    };

    const addToCart = (product, variant, isBonus = false) => {
        const variantId = variant ? variant.id : null;
        const cartItemId = variant
            ? `${product.id}-${variant.id}${isBonus ? '-bonus' : ''}`
            : `${product.id}${isBonus ? '-bonus' : ''}`;

        // Stock Logic for Edit:
        // Real Stock (DB) is 'stok' from props.
        // BUT, we are editing. So the items currently in this transaction are technically "ours".
        // HOWEVER, the props 'products' come from DB which might already have reduced stock from THIS transaction?
        // NO, when we edit, we usually see current available stock.
        // The previous Logic: `update` method reverts stock first, then applies.
        // So visually here:
        // We should treat "Stock" as `product.stok`. 
        // IF the item was already in the ORIGINAL transaction, we should add that original Qty to the available stock?
        // That is complicated on Frontend without knowing exactly which item corresponds to which original line.
        // SIMPLIFICATION: usage of `product.stok` from DB directly.
        // If user increases Qty, they take from available stock in DB.
        // If user decreases Qty, they return to stock.

        // Wait, if I bought 10 items (stock 0 left).
        // I edit. `product.stok` is 0.
        // I want to keep it 10. `addToCart` checks `10 > 0`? Error?
        // Yes, if we don't account for the fact that *we* hold the stock.

        // CORRECTION in `useEffect`: I added `+ d.qty` to `stok` property of cart item.
        // But `products` prop list `stok` is pure DB stock.
        // We need to adjust `products` list stock? Or just skip validation for existing amount?

        // Let's try to be smart.
        // The validation `if ((allInCartQty + 1) > availableStock)` needs `availableStock` to include what we effectively "own" in the current edited transaction.
        // But `availableStock` comes from `variant ? variant.stok : product.stok`.
        // We need to find if this product was in the original transaction, and add that original Qty to `availableStock`.

        // Let's try to pass `availableStock` cleanly.
        let dbStock = variant ? variant.stok : product.stok;

        // Find original qty of this specific variant in the transaction being edited
        // We can do this by looking at `transaksi.detail`.
        const originalDetail = transaksi.detail.find(d =>
            d.produk_id === product.id &&
            // Approximation for variant matching since we don't have variant_id
            (variant ? ((transaksi.channel === 'online' ? variant.harga_online : variant.harga_offline) == d.harga_satuan) : true) &&
            (isBonus ? d.harga_satuan == 0 : d.harga_satuan > 0)
        );
        const originalQty = originalDetail ? originalDetail.qty : 0;

        const effectiveStock = dbStock + originalQty;

        const existing = cart.find(item => item.cartItemId === cartItemId);
        const currentQty = existing ? existing.qty : 0;

        if ((currentQty + 1) > effectiveStock) {
            showAlert(`Stok tidak cukup. Sisa (termasuk punya saat ini): ${effectiveStock}`, 'error'); return;
        }

        if (existing) {
            setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, {
                ...product, cartItemId, variantId,
                variantName: variant ? variant.name : null,
                qty: 1, stok: effectiveStock, // Use effective stock here for limit checking in updateQty
                harga_online: isBonus ? 0 : (variant ? variant.harga_online : product.harga_online),
                harga_offline: isBonus ? 0 : (variant ? variant.harga_offline : product.harga_offline),
                gambar_utama: variant && variant.gambar ? variant.gambar : product.gambar_utama,
                isBonus: isBonus
            }]);
        }
        setShowVariantModal(false);
        setShowBonusModal(false);
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

    useEffect(() => {
        if (paymentMethod !== 'cash' && paymentMethod !== 'split') {
            setCustomerMoney(grandTotal);
        }
    }, [grandTotal, paymentMethod]);

    const splitTotalPaid = useMemo(() => splitPayments.reduce((acc, curr) => acc + (curr.nominal || 0), 0), [splitPayments]);
    const remainingSplit = Math.max(0, grandTotal - splitTotalPaid);

    const change = useMemo(() => {
        if (paymentMethod === 'cash') {
            return customerMoney >= grandTotal ? customerMoney - grandTotal : 0;
        }
        if (paymentMethod === 'split') {
            return splitTotalPaid >= grandTotal ? splitTotalPaid - grandTotal : 0;
        }
        return 0;
    }, [customerMoney, grandTotal, paymentMethod, splitTotalPaid]);

    const quickAmounts = [50000, 100000, 200000, 500000];

    // --- UPDATE TRANSAKSI ---
    const handleUpdate = async () => {
        if (cart.length === 0) return showAlert('Keranjang kosong', 'error');
        setIsProcessing(true);

        const payload = {
            cart: cart.map(i => ({
                id: i.id,
                variantId: i.variantId || null,
                qty: parseInt(i.qty),
                is_bonus: i.isBonus || false
            })),
            channel, paymentMethod, discount,
            customerMoney: parseFloat(paymentMethod === 'cash' ? customerMoney : grandTotal),
            payments: paymentMethod === 'split' ? splitPayments : []
        };

        router.put(route('transaksi.update', transaksi.id), payload, {
            onSuccess: () => {
                showAlert('Transaksi Berhasil Diupdate', 'success');
            },
            onError: (errors) => {
                showAlert(Object.values(errors)[0] || 'Gagal update', 'error');
                setIsProcessing(false);
            },
            onFinish: () => setIsProcessing(false)
        });
    };

    // --- HELPER FOR VARIANT STOCK DISPLAY IN MODAL/LIST ---
    // We need to show stock correctly (DB Stock + Original Qty if applicable)
    // This is visual only, actual check is in addToCart
    const getEffectiveStock = (product, variant = null) => {
        let dbStock = variant ? variant.stok : product.stok;
        // Find original
        const originalDetail = transaksi.detail.find(d =>
            d.produk_id === product.id &&
            (variant ? ((transaksi.channel === 'online' ? variant.harga_online : variant.harga_offline) == d.harga_satuan) : true) &&
            d.harga_satuan > 0 // Assume not bonus for standard display
        );
        return dbStock + (originalDetail ? originalDetail.qty : 0);
    };

    return (
        <GeneralLayout>
            <Head title={`Edit Transaksi #${transaksi.kode_transaksi}`} />

            {alertMessage && (
                <div className={`fixed top-6 right-6 z-[100] animate-in slide-in-from-top duration-300 bg-black text-white border-l-4 ${alertMessage.type === 'error' ? 'border-red-500' : 'border-green-500'} px-4 py-3 rounded shadow-2xl flex items-center gap-3`}>
                    {alertMessage.type === 'error' ? <ExclamationCircleIcon className="w-5 h-5 text-red-500" /> : <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                    <span className="text-sm font-bold">{alertMessage.message}</span>
                </div>
            )}

            <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans relative pb-24 lg:pb-0">

                {/* --- KIRI: KATALOG --- */}
                <div className="flex-1 flex flex-col h-full border-r border-gray-200">
                    <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white z-30 relative">
                        <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                            <button onClick={() => setChannel('offline')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${channel === 'offline' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>TOKO</button>
                            <button onClick={() => setChannel('online')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${channel === 'online' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>ONLINE</button>
                        </div>

                        {/* Category Filter Dropdown */}
                        <div className="w-full sm:w-64">
                            <Select
                                options={kategoris?.map(k => ({ value: k.id, label: k.nama_kategori })) || []}
                                value={selectedCategory}
                                onChange={setSelectedCategory}
                                isClearable
                                placeholder="Semua Kategori"
                                className="text-sm font-medium"
                                styles={{
                                    control: (base, state) => ({
                                        ...base,
                                        borderRadius: '0.5rem',
                                        borderColor: state.isFocused ? '#d1d5db' : 'transparent',
                                        backgroundColor: state.isFocused ? '#fff' : '#f9fafb',
                                        boxShadow: 'none',
                                        minHeight: '42px',
                                        transition: 'all 0.2s',
                                        '&:hover': { borderColor: '#d1d5db' }
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        zIndex: 9999,
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                        border: '1px solid #f3f4f6'
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected ? '#000' : (state.isFocused ? '#f3f4f6' : 'white'),
                                        color: state.isSelected ? 'white' : '#1f2937',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        padding: '10px 12px'
                                    }),
                                    placeholder: (base) => ({
                                        ...base,
                                        color: '#9ca3af',
                                        fontSize: '0.875rem'
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: '#1f2937',
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    })
                                }}
                            />
                        </div>
                        <div className="relative w-full sm:w-64 group">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-gray-900 transition-colors" />
                            <input type="text" placeholder="Cari produk..." className="w-full bg-gray-50 border-transparent focus:border-gray-300 focus:bg-white focus:ring-0 rounded-lg py-2 pl-9 pr-4 text-sm transition-all placeholder-gray-400 font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 bg-gray-50/30 hide-scroll pb-32 lg:pb-5">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-3">
                            <PencilSquareIcon className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-orange-800">Mode Edit Transaksi</h4>
                                <p className="text-xs text-orange-700">Anda sedang mengedit transaksi <strong>#{transaksi.kode_transaksi}</strong>. Stok barang akan disesuaikan otomatis setelah disimpan.</p>
                            </div>
                        </div>

                        {filteredProducts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                <CubeIcon className="w-16 h-16 mb-2 opacity-20" />
                                <p className="text-xs font-medium">Produk tidak ditemukan</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                {filteredProducts.map(product => {
                                    const hasError = imageErrors[product.id];
                                    const effStock = getEffectiveStock(product);
                                    const isOutOfStock = effStock <= 0 && !product.is_variant;
                                    const rawImage = product.gambar || product.gambar_utama;
                                    const imgPath = rawImage ? (rawImage.startsWith('http') ? rawImage : `/storage/${rawImage}`) : null;

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
                                                    {product.is_variant ? <span className="inline-block mt-1 text-[9px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">VARIAN</span> : <span className="text-[10px] text-gray-400">{effStock} stok</span>}
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
                <div className={`fixed lg:static bottom-16 md:bottom-0 lg:bottom-0 inset-x-0 z-30 lg:z-auto bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] lg:shadow-none ${isCartExpanded ? 'h-[calc(100dvh-150px)] rounded-t-2xl' : 'h-[80px] rounded-t-xl lg:h-full lg:w-[380px] xl:w-[420px] lg:rounded-none'}`}>
                    <div className="w-full h-6 flex justify-center items-center lg:hidden cursor-pointer bg-white rounded-t-xl shrink-0" onClick={() => setIsCartExpanded(!isCartExpanded)}><div className="w-12 h-1.5 bg-gray-300 rounded-full"></div></div>
                    <div className="px-5 pb-2 lg:py-4 border-b border-gray-100 flex justify-between items-center cursor-pointer lg:cursor-default shrink-0" onClick={() => window.innerWidth < 1024 && setIsCartExpanded(!isCartExpanded)}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ShoppingCartIcon className="w-6 h-6 text-gray-900" />
                                {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{cart.length}</span>}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">Keranjang Edit</h3>
                                <p className="text-[10px] text-gray-500 lg:hidden">Total: <span className="font-bold text-gray-900">{formatRupiah(grandTotal)}</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowBonusModal(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                                title="Tambah Bonus"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>Bonus</span>
                            </button>
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
                                            {item.isBonus ? (
                                                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">BONUS</span>
                                            ) : (
                                                <span className="text-[11px] text-gray-500">@ {formatRupiah(channel === 'online' ? item.harga_online : item.harga_offline)}</span>
                                            )}
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
                                <div className="flex items-center w-32 bg-white border border-gray-200 rounded-md px-2 h-7 focus-within:border-black transition-colors">
                                    <span className="text-gray-400 mr-1">-</span>
                                    <input
                                        type="text"
                                        className="w-full border-none p-0 text-right text-xs font-bold text-red-500 focus:ring-0 placeholder-gray-300"
                                        placeholder="0"
                                        value={formatNumberWithDots(discount)}
                                        onChange={handleNumberInput(setDiscount)}
                                    />
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
                                <input
                                    type="text"
                                    className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${paymentMethod === 'cash' ? 'bg-white border-gray-300 focus:ring-1 focus:ring-black text-gray-900' : 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed'}`}
                                    placeholder="Uang diterima..."
                                    value={formatNumberWithDots(customerMoney)}
                                    onChange={handleNumberInput(setCustomerMoney)}
                                    disabled={paymentMethod !== 'cash'}
                                />
                            </div>
                            {paymentMethod === 'cash' && (
                                <div className="flex gap-2 overflow-x-auto hide-scroll pb-1">
                                    {quickAmounts.map(amt => (
                                        <button key={amt} onClick={() => setCustomerMoney(amt)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-black hover:text-black transition-all flex-shrink-0 active:scale-95">{amt / 1000}k</button>
                                    ))}
                                    <button onClick={() => setCustomerMoney(grandTotal)} className="px-3 py-1.5 bg-gray-200 border border-transparent rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-300 transition-all flex-shrink-0 active:scale-95">Pas</button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3">
                            {[{ id: 'cash', l: 'Cash', i: BanknotesIcon }, { id: 'debit', l: 'Debit', i: CreditCardIcon }, { id: 'qr', l: 'QRIS', i: DevicePhoneMobileIcon }, { id: 'split', l: 'Split', i: CubeIcon }].map(m => (
                                <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex flex-col items-center justify-center py-2.5 rounded-lg border transition-all ${paymentMethod === m.id ? 'bg-black text-white border-black shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                                    <m.i className="w-4 h-4 mb-1" />
                                    <span className="text-[10px] font-bold uppercase">{m.l}</span>
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'split' && (
                            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold text-gray-900">Rincian Pembayaran</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${remainingSplit === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        Sisa: {formatRupiah(remainingSplit)}
                                    </span>
                                </div>
                                {splitPayments.map((p, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <select
                                            value={p.method}
                                            onChange={(e) => {
                                                const newSplit = [...splitPayments];
                                                newSplit[idx].method = e.target.value;
                                                setSplitPayments(newSplit);
                                            }}
                                            className="text-xs border-gray-300 rounded-lg focus:ring-black focus:border-black py-1.5"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="debit">Debit</option>
                                            <option value="qr">QRIS</option>
                                        </select>
                                        <div className="flex-1 relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rp</span>
                                            <input
                                                type="text"
                                                className="w-full pl-9 pr-2 py-1.5 text-xs font-bold border-gray-300 rounded-lg focus:ring-black focus:border-black"
                                                placeholder="Nominal..."
                                                value={formatNumberWithDots(p.nominal)}
                                                onChange={(e) => {
                                                    const rawValue = Number(e.target.value.replace(/\D/g, ''));
                                                    const newSplit = [...splitPayments];
                                                    newSplit[idx].nominal = rawValue;
                                                    setSplitPayments(newSplit);
                                                }}
                                            />
                                        </div>
                                        {splitPayments.length > 2 && (
                                            <button onClick={() => setSplitPayments(splitPayments.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {paymentMethod === 'cash' && (<div className="flex justify-between items-center mt-3 text-xs"><span className="text-gray-500">Kembalian</span><span className={`font-bold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatRupiah(change)}</span></div>)}

                        <button disabled={cart.length === 0 || (paymentMethod === 'cash' && customerMoney < grandTotal) || (paymentMethod === 'split' && splitTotalPaid < grandTotal) || isProcessing} onClick={handleUpdate} className="w-full mt-4 py-3.5 bg-black text-white rounded-xl text-sm font-bold shadow-lg hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                            {isProcessing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL BONUS --- */}
            {showBonusModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl relative flex flex-col max-h-[85vh]">
                        <button onClick={() => setShowBonusModal(false)} className="absolute top-4 right-4 p-1 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"><XMarkIcon className="w-5 h-5" /></button>

                        <div className="mb-4">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <CubeIcon className="w-6 h-6 text-indigo-600" /> Tambah Bonus
                            </h3>
                            <p className="text-xs text-gray-500">Item bonus harganya Rp 0 tapi tetap mengurangi stok.</p>
                        </div>

                        {/* Search Bonus */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Cari barang bonus..."
                                className="w-full bg-gray-50 border-gray-200 rounded-xl text-sm py-2.5 px-4 focus:ring-black focus:border-black"
                                value={bonusSearch}
                                onChange={(e) => setBonusSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 hide-scroll pr-1">
                            {products.filter(p => p.nama_produk.toLowerCase().includes(bonusSearch.toLowerCase())).map(p => {
                                const isExpanded = expandedBonusId === p.id;
                                const effStock = getEffectiveStock(p);
                                return (
                                    <div key={p.id} className={`border border-gray-100 rounded-xl overflow-hidden transition-all ${isExpanded ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white hover:border-indigo-300'}`}>
                                        <div
                                            onClick={() => {
                                                if (p.is_variant) {
                                                    setExpandedBonusId(isExpanded ? null : p.id);
                                                } else {
                                                    if (effStock > 0) addToCart(p, null, true);
                                                }
                                            }}
                                            className={`p-3 flex gap-3 items-center cursor-pointer ${effStock <= 0 && !p.is_variant ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                                                {p.gambar_utama ? <img src={`/storage/${p.gambar_utama}`} className="w-full h-full object-cover" /> : <PhotoIcon className="w-5 h-5 text-gray-300" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{p.nama_produk}</p>
                                                <div className="flex items-center gap-2">
                                                    {!p.is_variant && <p className="text-[10px] text-gray-500">{effStock} stok</p>}
                                                    {!!p.is_variant && <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 rounded border border-gray-200">Varian</span>}
                                                </div>
                                            </div>
                                            <div>
                                                {p.is_variant ? (
                                                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                ) : (
                                                    <PlusIcon className="w-5 h-5 text-indigo-600" />
                                                )}
                                            </div>
                                        </div>

                                        {!!p.is_variant && isExpanded && (
                                            <div className="bg-gray-50 border-t border-indigo-100 p-3 space-y-3 animate-in slide-in-from-top-1 duration-200">
                                                {p.variants.map(v => {
                                                    const vEffStock = getEffectiveStock(p, v);
                                                    return (
                                                        <div
                                                            key={v.id}
                                                            className={`w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-200 shadow-sm transition-all group ${vEffStock > 0 ? 'hover:border-indigo-300' : 'opacity-60 grayscale'}`}
                                                        >
                                                            <div className="w-12 h-12 bg-gray-50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                                                                {v.gambar ? <img src={v.gambar.startsWith('http') ? v.gambar : `/storage/${v.gambar}`} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-gray-400">{v.name.charAt(0)}</span>}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-900 truncate">{v.name}</p>
                                                                <p className={`text-[10px] font-medium ${vEffStock > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                                                                    {vEffStock > 0 ? `Stok: ${vEffStock}` : 'Habis'}
                                                                </p>
                                                            </div>
                                                            <div className="text-right flex flex-col items-end gap-1">
                                                                <span className="text-xs font-bold text-gray-900">{formatRupiah(channel === 'online' ? v.harga_online : v.harga_offline)}</span>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); addToCart(p, v, true); }}
                                                                    disabled={vEffStock <= 0}
                                                                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group-hover:bg-indigo-50 group-hover:text-indigo-600"
                                                                >
                                                                    <PlusIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL VARIAN --- */}
            {showVariantModal && selectedProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative">
                        <button onClick={() => setShowVariantModal(false)} className="absolute top-4 right-4 p-1 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"><XMarkIcon className="w-5 h-5" /></button>
                        <h3 className="font-bold text-lg text-gray-900 mb-1 pr-8">{selectedProduct.nama_produk}</h3>
                        <p className="text-xs text-gray-500 mb-4">Pilih varian:</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto hide-scroll">
                            {selectedProduct.variants.map(v => {
                                const effStock = getEffectiveStock(selectedProduct, v);
                                return (
                                    <button key={v.id} onClick={() => addToCart(selectedProduct, v)} disabled={effStock <= 0} className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-black transition-all group disabled:opacity-50 disabled:cursor-not-allowed bg-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                                                {v.gambar || selectedProduct.gambar_utama ? (
                                                    <img
                                                        src={(v.gambar || selectedProduct.gambar_utama).startsWith('http') ? (v.gambar || selectedProduct.gambar_utama) : `/storage/${v.gambar || selectedProduct.gambar_utama}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                                    />
                                                ) : null}
                                                <span className="text-xs font-bold text-gray-400" style={{ display: (v.gambar || selectedProduct.gambar_utama) ? 'none' : 'block' }}>{v.name.charAt(0)}</span>
                                            </div>
                                            <div className="text-left">
                                                <span className="block text-sm font-bold text-gray-800 group-hover:text-black">{v.name}</span>
                                                <span className={`block text-[10px] ${effStock > 0 ? 'text-gray-500' : 'text-red-500 font-bold'}`}>{effStock > 0 ? `Stok: ${effStock}` : 'Habis'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-xs font-bold text-gray-900">{formatRupiah(channel === 'online' ? v.harga_online : v.harga_offline)}</span>
                                            {effStock > 0 && <PlusIcon className="w-4 h-4 text-gray-300 group-hover:text-black ml-auto mt-1" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </GeneralLayout>
    );
}
