import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HomeIcon, ShoppingBagIcon, Cog6ToothIcon, MagnifyingGlassIcon,
    QuestionMarkCircleIcon, BellIcon, Squares2X2Icon, ClockIcon, MegaphoneIcon, ChartBarIcon
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid, ShoppingBagIcon as ShoppingBagIconSolid, Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';

export default function GeneralLayout({ header, children }) {
    const { url } = usePage();
    const user = usePage().props.auth.user;
    const currentRoute = route().current();

    const mobileNavItems = [
        { name: 'Dashboard', href: route('dashboard'), icon: HomeIcon, iconSolid: HomeIconSolid, active: currentRoute === 'dashboard' },
        { name: 'Products', href: route('produk.index'), icon: ShoppingBagIcon, iconSolid: ShoppingBagIconSolid, active: currentRoute?.startsWith('produk') },
        { name: 'Settings', href: route('profile.edit'), icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid, active: currentRoute === 'profile.edit' },
    ];

    const navItems = [
        { name: 'Dashboard', href: route('dashboard'), icon: Squares2X2Icon, active: currentRoute === 'dashboard' },
        { name: 'Products', href: route('produk.index'), icon: ShoppingBagIcon, active: currentRoute?.startsWith('produk') },
        { name: 'Orders', href: '#', icon: ClockIcon, active: false },
        { name: 'Marketing', href: '#', icon: MegaphoneIcon, active: false },
        { name: 'Analytics', href: '#', icon: ChartBarIcon, active: false },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
            {/* Desktop Navbar */}
            <nav className="hidden md:block pt-6 pb-2 px-4 md:px-6 sticky top-0 z-40 bg-gray-50/95 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <div className="bg-white rounded-full px-6 py-3 shadow-sm flex items-center min-w-fit border border-gray-100">
                            <img src="/images/logo-houston.png" alt="Houston Music" className="h-8 w-auto object-contain" />
                        </div>

                        {/* Navigation Menu (FIX SCROLLBAR HIDDEN) */}
                        <div className="bg-white rounded-full p-1.5 shadow-sm flex items-center overflow-x-auto max-w-[400px] lg:max-w-none border border-gray-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {navItems.map((item) => (
                                <Link key={item.name} href={item.href} className={`inline-flex items-center px-4 lg:px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${item.active ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}>
                                    {item.icon && <item.icon className={`h-4 w-4 mr-2 ${item.active ? 'text-gray-300' : 'text-gray-400'}`} />}
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="bg-white rounded-full pl-2 pr-2 py-2 shadow-sm flex items-center gap-2 border border-gray-100">
                            <div className="relative group hidden lg:block">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500" />
                                </div>
                                <input type="text" placeholder="Search..." className="block w-48 xl:w-64 rounded-full border-0 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                            </div>
                            <div className="h-6 w-px bg-gray-200 mx-1 hidden lg:block"></div>
                            <div className="flex items-center space-x-1">
                                <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><QuestionMarkCircleIcon className="h-6 w-6" /></button>
                                <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100"><BellIcon className="h-6 w-6" /></button>
                            </div>
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center ml-1 focus:outline-none">
                                        <div className="relative">
                                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} className="h-10 w-10 rounded-full border-2 border-white shadow-sm hover:opacity-90" />
                                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-400" />
                                        </div>
                                    </button>
                                </Dropdown.Trigger>
                                <Dropdown.Content align="right">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')}>Profile Settings</Dropdown.Link>
                                    <Dropdown.Link href={route('logout')} method="post" as="button" className="text-red-600 hover:bg-red-50">Log Out</Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Top Bar */}
            <div className="md:hidden bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
                <img src="/images/logo-houston.png" alt="Houston Music" className="h-8 w-auto object-contain" />
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} className="h-8 w-8 rounded-full border border-gray-200" />
            </div>

            {header && <header><div className="mx-auto max-w-7xl px-4 md:px-6 py-6">{header}</div></header>}

            {/* MAIN CONTENT CONTAINER with Animation */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-6 pt-6 sm:pt-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={url}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 h-16 flex justify-around items-center px-2 pb-safe">
                {mobileNavItems.map((item) => {
                    const Icon = item.active ? item.iconSolid : item.icon;
                    return (
                        <Link key={item.name} href={item.href} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${item.active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                            <Icon className={`h-6 w-6 mb-0.5 transition-transform ${item.active ? 'scale-110' : ''}`} />
                            <span className={`text-[10px] font-medium ${item.active ? 'font-bold' : ''}`}>{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
