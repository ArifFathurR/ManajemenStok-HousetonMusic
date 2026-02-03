import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ShoppingBagIcon, TagIcon, CurrencyDollarIcon, ArrowTrendingUpIcon,
    ExclamationTriangleIcon, ArchiveBoxIcon, ChevronRightIcon, ChartBarIcon,
    BuildingStorefrontIcon, GlobeAltIcon, BanknotesIcon
} from '@heroicons/react/24/outline';
// IMPORT COMPONENT PIE CHART
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard({
    auth,
    stats = {},
    low_stock_variants = [],
    chart_data = [],
    top_products = [],
    revenue_by_channel = { offline: 0, online: 0 }
}) {

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(number || 0);
    };

    // Data untuk Pie Chart
    const pieData = [
        { name: 'Offline (Toko)', value: revenue_by_channel.offline || 0, color: '#6366f1' }, // Indigo-500
        { name: 'Online', value: revenue_by_channel.online || 0, color: '#22c55e' }          // Green-500
    ];

    // Cek jika belum ada data sama sekali
    const hasRevenue = pieData.some(d => d.value > 0);

    return (
        <GeneralLayout>
            <Head title="Dashboard" />

            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Ringkasan performa toko bulan ini.</p>
            </div>

            {/* === 1. TOP SECTION: STATS CARDS === */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">

                {/* Hero Card */}
                <div className="lg:col-span-1 bg-gradient-to-br from-gray-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <CurrencyDollarIcon className="w-5 h-5 text-white/80" />
                            <span className="text-xs font-medium text-gray-300">Pendapatan</span>
                        </div>
                        <h2 className="text-2xl font-bold mt-1">{formatRupiah(stats.pendapatan)}</h2>
                        <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${stats.persen_pendapatan >= 0 ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
                            <ArrowTrendingUpIcon className={`w-3 h-3 ${stats.persen_pendapatan < 0 ? 'rotate-180' : ''}`} />
                            <span>{stats.persen_pendapatan > 0 ? '+' : ''}{stats.persen_pendapatan}%</span>
                        </div>
                    </div>
                    <div className="relative z-10 mt-6">
                        <p className="text-[10px] sm:text-xs text-gray-400">Update: {new Date().toLocaleDateString('id-ID')}</p>
                    </div>
                </div>

                {/* 3 Small Cards */}
                <div className="lg:col-span-3 grid grid-cols-3 gap-4">
                    {/* Produk */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ArchiveBoxIcon className="w-5 h-5" /></div>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">+{stats.produk_baru || 0} Baru</span>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-xl font-bold text-gray-900">{stats.total_produk}</h3>
                            <p className="text-xs text-gray-500">Total Produk</p>
                        </div>
                    </div>
                    {/* Terjual */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><ShoppingBagIcon className="w-5 h-5" /></div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stats.persen_terjual >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                {stats.persen_terjual > 0 ? '+' : ''}{stats.persen_terjual}%
                            </span>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-xl font-bold text-gray-900">{stats.terjual}</h3>
                            <p className="text-xs text-gray-500">Item Terjual</p>
                        </div>
                    </div>
                    {/* Kategori */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><TagIcon className="w-5 h-5" /></div>
                        </div>
                        <div className="mt-3">
                            <h3 className="text-xl font-bold text-gray-900">{stats.total_kategori}</h3>
                            <p className="text-xs text-gray-500">Kategori</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* === 2. MIDDLE SECTION: CHART & LOW STOCK === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* CHART */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-indigo-500" />
                            Trend Penjualan (Bulan Ini)
                        </h3>
                    </div>
                    <div className="h-64 w-full">
                        {chart_data && chart_data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chart_data}>
                                    <defs>
                                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} dy={10} />
                                    <YAxis hide={true} />
                                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value) => [formatRupiah(value), '']} />
                                    <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                Belum ada data transaksi.
                            </div>
                        )}
                    </div>
                </div>

                {/* LOW STOCK */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[340px]">
                    <div className="p-5 border-b border-gray-50 flex justify-between items-center shrink-0 bg-white z-10">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                            Stok Menipis
                        </h3>
                        <Link href={route('produk.index')} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">All</Link>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {low_stock_variants && low_stock_variants.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {low_stock_variants.map((variant) => (
                                    <Link key={variant.id} href={route('produk.show', variant.produk_id) + `?variant_id=${variant.id}`} className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group">
                                        <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                                            {variant.image ? <img src={variant.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingBagIcon className="w-4 h-4" /></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-gray-900 truncate">{variant.parent_name}</p>
                                            <p className="text-[10px] text-gray-500 truncate">Var: {variant.variant_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">{variant.stok}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm p-4 text-center">
                                Stok aman terkendali!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === 3. BOTTOM SECTION: TERLARIS & PIE CHART === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* TERLARIS */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-full">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingBagIcon className="w-5 h-5 text-orange-500" />
                        Terlaris Bulan Ini
                    </h3>
                    <div className="space-y-3">
                        {top_products && top_products.length > 0 ? (
                            top_products.map((product, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="font-bold text-gray-400 w-4 text-center">{idx + 1}</div>
                                    <div className="h-10 w-10 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                        {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBagIcon className="w-5 h-5" /></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-indigo-600">{product.sold} <span className="text-[10px] text-gray-500 font-normal">Terjual</span></p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-center text-gray-400 py-8">Belum ada penjualan bulan ini.</p>
                        )}
                    </div>
                </div>

                {/* NEW CARD: PIE CHART (Offline vs Online) */}
                <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-green-700" />
                        Sumber Pendapatan
                    </h3>

                    <div className="flex-1 min-h-[200px] relative">
                        {hasRevenue ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => formatRupiah(value)}
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                                Belum ada pendapatan.
                            </div>
                        )}

                        {/* Center Text (Total) - Opsional biar keren */}
                        {hasRevenue && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <span className="text-xs font-bold text-gray-400">Total</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </GeneralLayout>
    );
}
