import Dropdown from "@/Components/Dropdown";
import { Link, usePage } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    HomeIcon,
    ShoppingBagIcon,
    CalculatorIcon,
    BellIcon,
    Squares2X2Icon,
    ChartBarIcon,
    DocumentChartBarIcon,
} from "@heroicons/react/24/outline";
import {
    HomeIcon as HomeIconSolid,
    ShoppingBagIcon as ShoppingBagIconSolid,
    CalculatorIcon as CalculatorIconSolid,
    ChartBarIcon as ChartBarIconSolid,
} from "@heroicons/react/24/solid";

export default function GeneralLayout({ header, children }) {
    const { url } = usePage();
    const user = usePage().props.auth.user;
    const currentRoute = route().current();

    // Class wrapper standar agar SEMUA konten sejajar rapi kiri-kanan
    const containerClasses = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

    const mobileNavItems = [
        {
            name: "Beranda",
            href: route("dashboard"),
            icon: HomeIcon,
            iconSolid: HomeIconSolid,
            active: currentRoute === "dashboard",
        },
        {
            name: "Produk",
            href: route("produk.index"),
            icon: ShoppingBagIcon,
            iconSolid: ShoppingBagIconSolid,
            active: currentRoute?.startsWith("produk"),
        },
        {
            name: "Kasir",
            href: "#",
            icon: CalculatorIcon,
            iconSolid: CalculatorIconSolid,
            active: false,
        },
        {
            name: "Laporan",
            href: "#",
            icon: ChartBarIcon,
            iconSolid: ChartBarIconSolid,
            active: false,
        },
    ];

    const navItems = [
        {
            name: "Beranda",
            href: route("dashboard"),
            icon: Squares2X2Icon,
            active: currentRoute === "dashboard",
        },
        {
            name: "Produk",
            href: route("produk.index"),
            icon: ShoppingBagIcon,
            active: currentRoute?.startsWith("produk"),
        },
        { name: "Kasir", href: "#", icon: CalculatorIcon, active: false },
        {
            name: "Laporan",
            href: "#",
            icon: DocumentChartBarIcon,
            active: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-0 font-sans">
            {/* === DESKTOP NAVBAR === */}
            <nav className="hidden md:block pt-6 pb-2 sticky top-0 z-40 bg-gray-50/95 backdrop-blur-sm transition-all">
                <div className={containerClasses}>
                    <div className="flex items-center justify-between gap-4">
                        {/* 1. Logo Section */}
                        <div className="bg-white rounded-2xl px-5 py-2.5 shadow-sm border border-gray-100 flex items-center shrink-0 h-14">
                            <img
                                src="/images/logo-houston.png"
                                alt="Houston Music"
                                className="h-7 w-auto object-contain"
                            />
                        </div>

                        {/* 2. Navigation Menu (Centered & Compact) */}
                        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex items-center h-14">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                        item.active
                                            ? "bg-gray-900 text-white shadow-md"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                                >
                                    {item.icon && (
                                        <item.icon
                                            className={`h-4 w-4 mr-2 ${item.active ? "text-gray-300" : "text-gray-400"}`}
                                        />
                                    )}
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        {/* 3. Right Actions (User & Alert) */}
                        <div className="bg-white rounded-2xl pl-5 pr-2 py-1.5 shadow-sm border border-gray-100 flex items-center gap-4 h-14">
                            {/* Welcome Text Desktop */}
                            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
                                <span>
                                    Halo,{" "}
                                    <span className="font-bold text-gray-900">
                                        {user.name.split(" ")[0]}
                                    </span>
                                </span>
                                <img
                                    src="https://raw.githubusercontent.com/MartinHeinz/MartinHeinz/master/wave.gif"
                                    alt="Wave"
                                    className="w-5 h-5"
                                />
                            </div>

                            <div className="h-5 w-px bg-gray-200 hidden lg:block"></div>

                            {/* Notification */}
                            <button className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 relative transition-colors">
                                <BellIcon className="h-6 w-6" />
                                <span className="absolute top-2 right-2.5 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500 animate-pulse"></span>
                            </button>

                            {/* Profile Dropdown */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center focus:outline-none ml-1">
                                        <div className="relative group">
                                            <div className="h-9 w-9 rounded-full bg-indigo-100 border-2 border-white shadow-sm overflow-hidden group-hover:ring-2 ring-indigo-100 transition-all">
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`}
                                                    alt={user.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-500" />
                                        </div>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <div className="text-sm font-semibold text-gray-900 truncate">
                                            {user.name}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {user.email}
                                        </div>
                                    </div>
                                    <Dropdown.Link href={route("profile.edit")}>
                                        Pengaturan Akun
                                    </Dropdown.Link>
                                    <div className="border-t border-gray-100"></div>
                                    <Dropdown.Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                        className="text-red-600 hover:bg-red-50 w-full text-left"
                                    >
                                        Keluar
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </nav>

            {/* === MOBILE TOP BAR === */}
            <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
                {/* Logo Kiri */}
                <img
                    src="/images/logo-houston.png"
                    alt="Houston Music"
                    className="h-7 w-auto object-contain"
                />

                {/* Group Kanan: Salam & Profile */}
                <div className="flex items-center gap-3">
                    {/* Salam Mobile + GIF */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span>
                            Halo,{" "}
                            <span className="font-bold text-gray-900">
                                {user.name.split(" ")[0]}
                            </span>
                        </span>
                        <img
                            src="https://raw.githubusercontent.com/MartinHeinz/MartinHeinz/master/wave.gif"
                            alt="Wave"
                            className="w-4 h-4"
                        />
                    </div>

                    {/* Mobile Profile Dropdown */}
                    <Dropdown>
                        <Dropdown.Trigger>
                            <button className="focus:outline-none relative">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`}
                                    alt={user.name}
                                    className="h-8 w-8 rounded-full border border-gray-100 shadow-sm"
                                />
                                <span className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-white"></span>
                            </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="right" width="48">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                <div className="text-sm font-bold text-gray-900">
                                    {user.name}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                    {user.email}
                                </div>
                            </div>
                            <Dropdown.Link href={route("profile.edit")}>
                                Pengaturan
                            </Dropdown.Link>
                            <Dropdown.Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="text-red-600 font-medium"
                            >
                                Keluar
                            </Dropdown.Link>
                        </Dropdown.Content>
                    </Dropdown>
                </div>
            </div>

            {/* Header Content (Judul Halaman) */}
            {header && (
                <header className="py-6">
                    <div className={containerClasses}>{header}</div>
                </header>
            )}

            {/* === MAIN CONTENT CONTAINER === */}
            <main>
                <div className="mt-2">
                    <div className={containerClasses}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={url}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                            >
                                {children}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            {/* === MOBILE BOTTOM NAV === */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50 h-16 flex justify-around items-center px-2 pb-safe">
                {mobileNavItems.map((item) => {
                    const Icon = item.active ? item.iconSolid : item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 group ${item.active ? "text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            <div
                                className={`p-1 rounded-xl transition-all ${item.active ? "bg-gray-100" : "group-active:scale-90"}`}
                            >
                                <Icon
                                    className={`h-6 w-6 ${item.active ? "text-gray-900" : ""}`}
                                />
                            </div>
                            <span
                                className={`text-[10px] mt-0.5 font-medium ${item.active ? "font-bold" : ""}`}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
