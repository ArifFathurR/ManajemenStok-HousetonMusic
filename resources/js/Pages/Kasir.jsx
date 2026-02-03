import { Head } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import { 
  FiSearch, FiShoppingCart, FiTrash2, FiCreditCard, 
  FiSmartphone, FiDollarSign, FiPlus, FiMinus, 
  FiBox, FiArrowLeft, FiX, FiPrinter, FiChevronUp, FiChevronDown, FiTag
} from 'react-icons/fi';

export default function Kasir({ auth, products }) {
    // --- 1. STATE MANAGEMENT ---
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [channel, setChannel] = useState('offline'); // online atau offline
    const [paymentMethod, setPaymentMethod] = useState('cash'); 
    const [discount, setDiscount] = useState(0); 
    const [customerMoney, setCustomerMoney] = useState(0);
    const [showReceipt, setShowReceipt] = useState(false);
    const [isCartExpanded, setIsCartExpanded] = useState(false); // Untuk slide-up mobile
    const [transactionId, setTransactionId] = useState("");
    
    // State untuk Modal Varian
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);

    // --- 2. DATA DUMMY (Sesuai database manajemen-stok.sql) ---
    const allProducts = products || [
        { 
            id: 1, 
            nama_produk: 'Gitar Fender Stratocaster', 
            kategori: 'Instruments', 
            stok: 10, 
            harga_online: 8500000, 
            harga_offline: 8200000, 
            satuan: 'Pcs',
            variants: [
                { id: 101, name: 'Sunburst', color: '#8B4513' },
                { id: 102, name: 'Olympic White', color: '#F5F5F5' },
                { id: 103, name: 'Midnight Black', color: '#000000' }
            ]
        },
        { 
            id: 2, 
            nama_produk: 'Keyboard Roland XPS-10', 
            kategori: 'Keyboards', 
            stok: 5, 
            harga_online: 7200000, 
            harga_offline: 7000000, 
            satuan: 'Unit',
            variants: [] // Produk tanpa varian
        },
    ];

    // --- 3. LOGIC PENCARIAN & FILTER ---
    const filteredProducts = allProducts.filter(p => 
        p.nama_produk.toLowerCase().includes(search.toLowerCase())
    );

    // --- 4. LOGIC KERANJANG & VARIAN ---
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
            item.cartItemId === cartItemId ? { ...item, qty: Math.max(1, item.qty + delta) } : item
        ).filter(item => item.qty > 0));
    };

    // --- 5. KALKULASI HARGA ---
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => {
            const harga = channel === 'online' ? item.harga_online : item.harga_offline;
            return acc + (harga * item.qty);
        }, 0);
    }, [cart, channel]);

    const grandTotal = subtotal - discount;
    const change = useMemo(() => (customerMoney - grandTotal > 0 ? customerMoney - grandTotal : 0), [customerMoney, grandTotal]);
    const quickAmounts = [50000, 100000, 200000, 500000];

    // --- 6. HANDLERS ---
    const handleFinalize = () => {
        setTransactionId("TRX-" + Date.now().toString().slice(-6));
        setShowReceipt(true);
    };

    const resetTransaction = () => {
        setCart([]); setDiscount(0); setCustomerMoney(0); setShowReceipt(false); setIsCartExpanded(false);
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans flex flex-col lg:flex-row h-screen overflow-hidden text-slate-800">
            <Head title="Kasir - Houston Music" />
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100% !important; }
                    .no-print { display: none !important; }
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}} />

            {/* --- SISI KIRI: KATALOG (no-print) --- */}
            <div className="flex-grow flex flex-col h-full overflow-hidden border-r border-slate-100 print:hidden text-sans">
                <header className="bg-white/80 backdrop-blur-md p-5 flex flex-col sm:flex-row gap-4 justify-between items-center z-20 border-b border-slate-100">
                    <div className="flex items-center gap-3 w-full sm:w-auto text-sans">
                        <button className="p-2.5 hover:bg-slate-50 rounded-2xl border border-slate-100 shadow-sm"><FiArrowLeft className="text-slate-600" /></button>
                        <div>
                            <h1 className="text-xl font-[900] italic tracking-tighter uppercase leading-none">POS SYSTEM</h1>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Houston Music</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-100 rounded-2xl p-1 w-full sm:w-auto">
                        <button onClick={() => setChannel('offline')} className={`flex-1 sm:px-8 py-2.5 text-[10px] font-black rounded-xl transition-all ${channel === 'offline' ? 'bg-black text-white shadow-xl' : 'text-slate-400'}`}>OFFLINE</button>
                        <button onClick={() => setChannel('online')} className={`flex-1 sm:px-8 py-2.5 text-[10px] font-black rounded-xl transition-all ${channel === 'online' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400'}`}>ONLINE</button>
                    </div>
                </header>

                <div className="p-6 overflow-y-auto flex-grow space-y-6 pb-40 lg:pb-6 no-scrollbar text-sans">
                    <div className="relative group max-w-2xl">
                        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-black" />
                        <input type="text" placeholder="Cari nama produk..." className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-14 pr-6 shadow-sm outline-none text-sm font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} onClick={() => handleProductClick(product)} className="bg-white p-4 rounded-[2.5rem] border border-slate-100 hover:border-black transition-all cursor-pointer group flex flex-col relative overflow-hidden active:scale-95">
                                <div className="aspect-square bg-slate-50 rounded-[1.8rem] mb-4 flex items-center justify-center text-slate-200 group-hover:bg-slate-100 transition-colors"><FiBox size={42} /></div>
                                <h4 className="font-bold text-sm text-slate-900 truncate mb-1">{product.nama_produk}</h4>
                                <div className="flex justify-between items-end mt-auto">
                                    <span className="font-[900] text-sm">Rp {(channel === 'online' ? product.harga_online : product.harga_offline).toLocaleString()}</span>
                                    {product.variants.length > 0 && <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-2 py-0.5 rounded-full">VARIAN</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- SISI KANAN: KERANJANG (SLIDE-UP) --- */}
            <div className={`fixed lg:static inset-x-0 bottom-0 z-40 bg-white border-l border-slate-100 flex flex-col transition-all duration-700 print:hidden ${isCartExpanded ? 'h-[90vh]' : 'h-[100px] lg:h-full lg:w-[400px] xl:w-[450px]'}`}>
                <div className="p-4 md:p-6 border-b border-slate-50 flex justify-between items-center cursor-pointer lg:cursor-default" onClick={() => window.innerWidth < 1024 && setIsCartExpanded(!isCartExpanded)}>
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200"><FiShoppingCart size={18} /></div>
                        <div><h3 className="font-[900] text-sm italic uppercase tracking-tighter">Order List</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cart.length} Items</p></div>
                    </div>
                    <div className="lg:hidden text-slate-300 animate-bounce">{isCartExpanded ? <FiChevronDown size={24} /> : <FiChevronUp size={24} />}</div>
                </div>

                <div className={`flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar ${!isCartExpanded && 'hidden lg:block'}`}>
                    {cart.map(item => (
                        <div key={item.cartItemId} className="flex justify-between items-center bg-slate-50 p-4 rounded-[2rem] border border-slate-100">
                            <div className="max-w-[60%]">
                                <p className="text-xs font-[900] text-slate-900 leading-tight truncate">{item.nama_produk}</p>
                                {item.variantName && <p className="text-[9px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">Varian: {item.variantName}</p>}
                                <p className="text-[10px] font-bold text-slate-400 mt-1 italic uppercase">Rp {(channel === 'online' ? item.harga_online : item.harga_offline).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                <button onClick={() => updateQty(item.cartItemId, -1)} className="text-red-500"><FiMinus size={12}/></button>
                                <span className="text-xs font-black w-4 text-center">{item.qty}</span>
                                <button onClick={() => updateQty(item.cartItemId, 1)} className="text-blue-500"><FiPlus size={12}/></button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-200 py-10 italic text-[10px] uppercase font-black tracking-[0.3em]">Cart Empty</div>}
                </div>

                <div className={`p-6 md:p-8 bg-slate-50 border-t border-slate-200 rounded-t-[3rem] lg:rounded-none space-y-4 shadow-inner ${!isCartExpanded && 'hidden lg:block'}`}>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200"><label className="text-[9px] font-black text-slate-300 uppercase block mb-1">Discount (Rp)</label><input type="number" className="w-full bg-transparent border-none p-0 font-black text-sm focus:ring-0" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-200"><label className="text-[9px] font-black text-blue-400 uppercase block mb-1">Customer Pay</label><input type="number" className="w-full bg-transparent border-none p-0 font-black text-sm focus:ring-0 text-blue-600" value={customerMoney || ''} onChange={(e) => setCustomerMoney(Number(e.target.value))} placeholder="0.00" /></div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                        {quickAmounts.map(amount => (<button key={amount} onClick={() => setCustomerMoney(amount)} className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[10px] font-black hover:bg-black hover:text-white transition-all">+{amount/1000}K</button>))}
                        <button onClick={() => setCustomerMoney(grandTotal)} className="px-4 py-2 bg-blue-600 text-white rounded-2xl text-[10px] font-black">PAS</button>
                    </div>
                    <div className="pt-4 border-t border-slate-200 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase italic"><span>Change</span><span className={change > 0 ? 'text-green-600 font-[900]' : ''}>Rp {change.toLocaleString()}</span></div>
                        <div className="flex justify-between items-center font-black text-lg italic tracking-tighter uppercase text-slate-400"><span>Grand Total</span><span className="text-black text-3xl font-[900] tracking-tighter italic">Rp {grandTotal.toLocaleString()}</span></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        {['cash', 'debit', 'qr'].map(method => (
                            <button key={method} onClick={() => setPaymentMethod(method)} className={`flex flex-col items-center py-3 rounded-[1.2rem] border-2 transition-all ${paymentMethod === method ? 'bg-black text-white border-black shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-300'}`}>
                                {method === 'cash' && <FiDollarSign size={18} />}
                                {method === 'debit' && <FiCreditCard size={18} />}
                                {method === 'qr' && <FiSmartphone size={18} />}
                                <span className="text-[8px] font-black tracking-widest uppercase mt-1">{method}</span>
                            </button>
                        ))}
                    </div>
                    <button disabled={cart.length === 0 || (paymentMethod === 'cash' && customerMoney < grandTotal)} onClick={handleFinalize} className="w-full py-5 rounded-[2rem] font-black text-sm tracking-[0.1em] transition-all bg-black text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-200">PROCESS TRANSACTION</button>
                </div>
            </div>

            {/* --- MODAL PILIH VARIAN --- */}
            {showVariantModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-[900] text-xl leading-tight uppercase italic">{selectedProduct.nama_produk}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Select Product Variant</p>
                            </div>
                            <button onClick={() => setShowVariantModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><FiX /></button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {selectedProduct.variants.map(variant => (
                                <button key={variant.id} onClick={() => addToCart(selectedProduct, variant)} className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-50 hover:border-black transition-all group active:scale-95 text-left">
                                    <div className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: variant.color }}></div>
                                    <span className="font-[900] text-sm uppercase tracking-tight group-hover:translate-x-2 transition-transform">{variant.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL STRUK (SIAP PRINT) --- */}
            {showReceipt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:bg-white print:p-0 print:static">
                    <div className="print-area bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl print:shadow-none print:w-full print:rounded-none">
                        <div className="p-8 space-y-6 text-slate-800">
                            <div className="text-center space-y-1">
                                <h2 className="font-[900] text-3xl italic tracking-tighter uppercase leading-none">Houston Music</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] italic">Official Receipt</p>
                                <div className="border-b border-dashed border-slate-200 pt-4"></div>
                            </div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase space-y-1.5 tracking-tight">
                                <div className="flex justify-between"><span>Receipt ID</span><span className="text-slate-900">#{transactionId}</span></div>
                                <div className="flex justify-between"><span>Operator</span><span className="text-slate-900">{auth?.user?.name || "Admin Houston"}</span></div>
                                <div className="flex justify-between"><span>Channel</span><span className="text-blue-600 font-[900] italic">{channel.toUpperCase()}</span></div>
                                <div className="flex justify-between"><span>DateTime</span><span className="text-slate-900">{new Date().toLocaleString()}</span></div>
                            </div>
                            <div className="border-b border-dashed border-slate-200"></div>
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.cartItemId} className="text-xs font-bold leading-tight">
                                        <div className="flex justify-between mb-1 uppercase tracking-tight">
                                            <span>{item.nama_produk} {item.variantName && `(${item.variantName})`}</span>
                                            <span>Rp {(item.qty * (channel === 'online' ? item.harga_online : item.harga_offline)).toLocaleString()}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium italic">{item.qty} x Rp {(channel === 'online' ? item.harga_online : item.harga_offline).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-b border-dashed border-slate-200"></div>
                            <div className="space-y-2 text-xs font-bold uppercase tracking-tighter">
                                <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>Rp {subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between text-red-500 italic"><span>Discount</span><span>- Rp {discount.toLocaleString()}</span></div>
                                <div className="flex justify-between font-[900] text-2xl pt-4 italic text-black leading-none border-t border-slate-100 uppercase tracking-tighter"><span>Total Due</span><span>Rp {grandTotal.toLocaleString()}</span></div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-[1.5rem] space-y-1.5 border border-slate-100">
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase"><span>Method</span><span className="text-slate-900">{paymentMethod.toUpperCase()}</span></div>
                                <div className="flex justify-between text-[10px] font-black text-slate-400 border-t border-slate-200 pt-2 mt-2 font-[900]"><span className="text-green-600 italic uppercase">Change</span><span className="text-green-600 text-sm tracking-normal font-sans">Rp {change.toLocaleString()}</span></div>
                            </div>
                            <div className="text-center pt-4 italic text-slate-300 text-[10px] font-bold uppercase tracking-[0.4em]">Thank You For Shopping</div>
                        </div>
                        <div className="bg-slate-50 p-6 flex gap-4 border-t border-slate-100 no-print">
                            <button onClick={resetTransaction} className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:text-red-500 tracking-widest"><FiX size={14} /> Close</button>
                            <button onClick={() => window.print()} className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-2xl hover:bg-slate-800 tracking-widest flex items-center justify-center gap-2"><FiPrinter size={14} /> Print</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}