import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import {
    HomeIcon,
    ShoppingBagIcon,
    Cog6ToothIcon,
    MagnifyingGlassIcon,
    QuestionMarkCircleIcon,
    BellIcon,
    Squares2X2Icon,
    ClockIcon,
    MegaphoneIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    ShoppingBagIcon as ShoppingBagIconSolid,
    Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';

export default function TestLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const currentRoute = route().current();

    // Navigation items untuk mobile bottom nav
    const mobileNavItems = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: HomeIcon,
            iconSolid: HomeIconSolid,
            active: currentRoute === 'dashboard',
        },
        {
            name: 'Products',
            href: route('produk.index'),
            icon: ShoppingBagIcon,
            iconSolid: ShoppingBagIconSolid,
            active: currentRoute?.startsWith('produk'),
        },
        {
            name: 'Settings',
            href: route('profile.edit'),
            icon: Cog6ToothIcon,
            iconSolid: Cog6ToothIconSolid,
            active: currentRoute === 'profile.edit',
        },
    ];

    // Pill navigation items (Desktop)
    const navItems = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: Squares2X2Icon,
            active: currentRoute === 'dashboard',
        },
        {
            name: 'Products',
            href: route('produk.index'),
            icon: ShoppingBagIcon,
            active: currentRoute?.startsWith('produk'),
        },
        {
            name: 'Orders',
            href: '#',
            icon: ClockIcon,
            active: false,
        },
        {
            name: 'Marketing',
            href: '#',
            icon: MegaphoneIcon,
            active: false,
        },
        {
            name: 'Analytics',
            href: '#',
            icon: ChartBarIcon,
            active: false,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-0">
            {/* Desktop Navigation (Floating Cards Style) */}
            <nav className="hidden md:block pt-6 pb-2 px-6">
                <div className="mx-auto max-w-7xl">
                    <div className="flex items-center justify-between gap-4">

                        {/* CARD 1: Logo Section */}
                        <div className="bg-white rounded-full px-6 py-3 shadow-sm flex items-center gap-3 min-w-fit">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-900 tracking-tight">Sellora</span>
                        </div>

                        {/* CARD 2: Central Navigation Section */}
                        <div className="bg-white rounded-full p-1.5 shadow-sm flex items-center">
                            {navItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`inline-flex items-center px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                        item.active
                                            ? 'bg-black text-white shadow-md'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    {item.icon && (
                                        <item.icon className={`h-4 w-4 mr-2 ${item.active ? 'text-gray-300' : 'text-gray-400'}`} />
                                    )}
                                    {item.name}
                                </Link>
                            ))}
                        </div>

                        {/* CARD 3: Search, Icons, & Profile Section */}
                        <div className="bg-white rounded-full pl-2 pr-2 py-2 shadow-sm flex items-center gap-2">
                            {/* Search Bar */}
                            <div className="relative group">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search Anything..."
                                    className="block w-64 rounded-full border-0 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="h-6 w-px bg-gray-200 mx-1"></div>

                            <div className="flex items-center space-x-1">
                                <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                    <QuestionMarkCircleIcon className="h-6 w-6" />
                                </button>
                                <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                    <BellIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center ml-1 focus:outline-none">
                                        <div className="relative">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                                alt={user.name}
                                                className="h-10 w-10 rounded-full border-2 border-white shadow-sm hover:opacity-90 transition-opacity"
                                            />
                                            <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-400" />
                                        </div>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content align="right">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile Settings
                                    </Dropdown.Link>
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Top Bar */}
            <div className="md:hidden bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-gray-900">Sellora</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                            alt={user.name}
                            className="h-8 w-8 rounded-full"
                        />
                    </div>
                </div>
            </div>

            {header && (
                <header className="">
                    <div className="mx-auto max-w-7xl px-6 py-6">
                        {header}
                    </div>
                </header>
            )}

            {/* MAIN CONTENT: Added pt-6 for mobile spacing */}
            <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-6 pt-6 sm:pt-0">
                {children}
            </main>

            {/* Mobile Bottom Navigation (REVERTED TO WHITE BG, BLACK ACTIVE TEXT) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
                <div className="flex justify-around items-center h-16 px-2">
                    {mobileNavItems.map((item) => {
                        const Icon = item.active ? item.iconSolid : item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full transition ${
                                    item.active
                                        ? 'text-gray-900' // Hitam untuk status Aktif
                                        : 'text-gray-400 hover:text-gray-600' // Abu-abu untuk Inaktif
                                }`}
                            >
                                <Icon className="h-6 w-6 mb-1" />
                                <span className={`text-[10px] font-medium ${item.active ? 'font-bold' : ''}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
