import { Head } from '@inertiajs/react';
import React, { useState } from 'react';
import { 
  FiBox, FiShoppingCart, FiTrendingUp, FiAlertCircle, 
  FiDownload, FiArrowRight, FiUser, FiHome, FiSettings,
  FiPieChart, FiTag
} from 'react-icons/fi';

export default function Tampilan({ auth, stats, lowStockProducts }) {
    const [reportRange, setReportRange] = useState('7_days');

    // Data Navigasi
    const navLinks = [
        { name: 'Dashboard', icon: <FiHome />, active: true },
        { name: 'Products', icon: <FiBox />, active: false },
        { name: 'Orders', icon: <FiShoppingCart />, active: false },
        { name: 'Settings', icon: <FiSettings />, active: false },
    ];

    // Data dummy untuk visualisasi
    const displayStats = stats || [
        { id: 1, label: 'Total Penjualan', value: 'Rp 45.200.000', icon: <FiTrendingUp />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 2, label: 'Penjualan Online', value: 'Rp 28.500.000', icon: <FiBox />, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 3, label: 'Penjualan Offline', value: 'Rp 16.700.000', icon: <FiShoppingCart />, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 4, label: 'Stok Menipis', value: '12 Item', icon: <FiAlertCircle />, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    const lowStock = lowStockProducts || [
        { id: 1, nama_produk: 'Apple AirPods Max', kategori: 'Accessories', stok: 2, satuan: 'Pcs' },
        { id: 2, nama_produk: 'Guitar Cable 3m', kategori: 'Cables', stok: 5, satuan: 'Pcs' },
        { id: 3, nama_produk: 'Drum Stick 5A', kategori: 'Peripherals', stok: 3, satuan: 'Pair' },
    ];

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans pb-24 lg:pb-0">
            <Head title="Dashboard - Houston Music" />

            {/* --- TOP NAVBAR (Desktop Only) --- */}
            <nav className="hidden lg:block bg-white border-b border-gray-100 px-8 py-3 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <img src="/logo-houston.png" alt="Logo" className="h-10" onerror="this.src='https://placehold.co/100x40?text=Houston'"/>
                    </div>

                    <div className="flex items-center bg-[#F8F9FA] rounded-full px-2 py-1 border border-gray-100">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${
                                    link.active ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {link.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#800040] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner">
                            YU
                        </div>
                    </div>
                </div>
            </nav>

            {/* --- MOBILE HEADER (Logo & Profile Only) --- */}
            <header className="lg:hidden bg-white px-6 py-4 flex justify-between items-center border-b border-gray-100 sticky top-0 z-50">
                <img src="/logo-houston.png" alt="Logo" className="h-8" onerror="this.src='https://placehold.co/80x30?text=Houston'"/>
                <div className="w-9 h-9 bg-[#800040] rounded-full flex items-center justify-center text-white font-bold text-xs">
                    YU
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <div className="py-8 px-4 md:px-8">
                <div className="mx-auto max-w-7xl space-y-8">
                    
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">Product Details</h2>
                            <p className="text-sm text-gray-400 font-medium tracking-tight">Detailed information about your inventory.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
                                <button onClick={() => setReportRange('7_days')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${reportRange === '7_days' ? 'bg-[#0F172A] text-white' : 'text-gray-400'}`}>7D</button>
                                <button onClick={() => setReportRange('10_days')} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${reportRange === '10_days' ? 'bg-[#0F172A] text-white' : 'text-gray-400'}`}>10D</button>
                            </div>
                            <button className="bg-white border border-gray-200 p-2.5 rounded-2xl text-gray-700 shadow-sm"><FiDownload /></button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {displayStats.map((stat) => (
                            <div key={stat.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h3 className="text-xl font-black text-gray-900 leading-none">{stat.value}</h3>
                                </div>
                                <div className={`p-4 rounded-[1.2rem] ${stat.bg} ${stat.color} text-2xl`}>
                                    {stat.icon}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Chart Area */}
                        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-black text-gray-900 tracking-tight">Sales Analytics</h3>
                                <div className="flex gap-3 text-[10px] font-black uppercase">
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-600 rounded-full"></div> Online</span>
                                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-gray-300 rounded-full"></div> Offline</span>
                                </div>
                            </div>
                            <div className="h-64 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-300 italic font-bold tracking-widest uppercase text-[10px]">
                                Chart Visualization
                            </div>
                        </div>

                        {/* Stock Alert */}
                        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-50">
                            <h3 className="font-black text-gray-900 tracking-tight text-lg mb-6 flex items-center gap-2">
                                Low Stock <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            </h3>
                            <div className="space-y-4">
                                {lowStock.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-[1.5rem] border border-transparent hover:border-red-100 transition-colors">
                                        <div>
                                            <p className="text-sm font-black text-gray-800">{item.nama_produk}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{item.kategori}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-red-600">{item.stok} <span className="text-[10px] text-gray-400 font-normal">{item.satuan}</span></p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-6 py-4 text-[10px] font-black text-gray-400 border border-gray-100 rounded-[1.2rem] hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                VIEW CATALOG <FiArrowRight />
                            </button>
                        </div>
                    </div>

                    {/* Quick Action Banner */}
                    <div className="bg-[#0F172A] text-white p-8 md:p-12 rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 text-center md:text-left">
                            <h2 className="text-3xl font-black mb-3 italic tracking-tighter italic">KASIR HOUSTON</h2>
                            <p className="text-blue-200/50 text-xs mb-8 max-w-xs font-medium mx-auto md:mx-0">
                                Transaksi otomatis mengurangi stok secara real-time.
                            </p>
                            <button className="bg-white text-[#0F172A] px-10 py-4 rounded-[1.5rem] font-black text-sm hover:scale-105 transition-transform flex items-center gap-3 shadow-xl mx-auto md:mx-0">
                                <FiShoppingCart /> MULAI TRANSAKSI
                            </button>
                        </div>
                        <FiBox size={200} className="absolute right-[-20px] bottom-[-40px] opacity-5 transform -rotate-12 hidden lg:block" />
                    </div>
                </div>
            </div>

            {/* --- BOTTOM NAVIGATION BAR (Mobile Only) --- */}
            <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                {navLinks.map((link) => (
                    <button
                        key={link.name}
                        className={`flex flex-col items-center gap-1 transition-all ${
                            link.active ? 'text-black' : 'text-gray-300'
                        }`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${link.active ? 'bg-black text-white shadow-lg shadow-black/20 scale-110' : ''}`}>
                            {React.cloneElement(link.icon, { size: 20 })}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${link.active ? 'opacity-100' : 'opacity-0'}`}>
                            {link.name}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}