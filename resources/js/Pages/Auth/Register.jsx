import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    UserIcon, 
    EnvelopeIcon, 
    LockClosedIcon, 
    BuildingStorefrontIcon 
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function Register({ tokos }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        toko_id: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-0 font-sans">
            <Head title="Register" />

            {/* CARD WRAPPER */}
            <div className="w-full mx-6 sm:mx-0 sm:max-w-md bg-white shadow-2xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100/50 overflow-hidden transition-all duration-300">
                
                <div className="px-6 py-10 sm:px-10">
                    
                    {/* Header Bagian Atas */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-50 mb-6 mx-auto overflow-hidden">
                            <img
                                src="/images/logo-houston.png"
                                alt="Houston Music"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Daftar Akun</h1>
                        <p className="text-gray-500 text-base mt-2">Buat akun baru untuk mulai mengelola toko</p>
                    </motion.div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Input Nama */}
                        <div className="space-y-1.5">
                            <InputLabel htmlFor="name" value="Nama Lengkap" className="text-gray-900 font-bold ml-1" />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-base shadow-inner"
                                    autoComplete="name"
                                    isFocused={true}
                                    placeholder="Masukkan nama lengkap"
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.name} className="mt-1 ml-2" />
                        </div>

                        {/* Pilih Toko */}
                        <div className="space-y-1.5">
                            <InputLabel htmlFor="toko_id" value="Pilih Toko" className="text-gray-900 font-bold ml-1" />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <select
                                    id="toko_id"
                                    name="toko_id"
                                    value={data.toko_id}
                                    onChange={(e) => setData('toko_id', e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-base shadow-inner appearance-none cursor-pointer"
                                    required
                                >
                                    <option value="">-- Pilih Toko --</option>
                                    {tokos.map((toko) => (
                                        <option key={toko.id} value={toko.id}>
                                            {toko.nama_toko}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <InputError message={errors.toko_id} className="mt-1 ml-2" />
                        </div>

                        {/* Input Email */}
                        <div className="space-y-1.5">
                            <InputLabel htmlFor="email" value="Email" className="text-gray-900 font-bold ml-1" />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-base shadow-inner"
                                    autoComplete="username"
                                    placeholder="nama@email.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1 ml-2" />
                        </div>

                        {/* Input Password */}
                        <div className="space-y-1.5">
                            <InputLabel htmlFor="password" value="Password" className="text-gray-900 font-bold ml-1" />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-base shadow-inner"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.password} className="mt-1 ml-2" />
                        </div>

                        {/* Konfirmasi Password */}
                        <div className="space-y-1.5">
                            <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" className="text-gray-900 font-bold ml-1" />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-base shadow-inner"
                                    autoComplete="new-password"
                                    placeholder="Ulangi password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    required
                                />
                            </div>
                            <InputError message={errors.password_confirmation} className="mt-1 ml-2" />
                        </div>

                        {/* Tombol Register */}
                        <div className="pt-4">
                            <PrimaryButton 
                                className="w-full flex justify-center items-center py-5 bg-gray-900 hover:bg-black text-white rounded-[1.25rem] shadow-xl shadow-gray-200 active:scale-95 transition-all font-bold text-base uppercase tracking-widest" 
                                disabled={processing}
                            >
                                {processing ? 'Mendaftar...' : 'Daftar Sekarang'}
                            </PrimaryButton>
                        </div>

                        {/* Link Login */}
                        <div className="text-center mt-6">
                            <p className="text-gray-500 text-sm font-medium">
                                Sudah punya akun?{' '}
                                <Link href={route('login')} className="text-gray-900 font-extrabold hover:underline underline-offset-4 transition-all">
                                    Masuk Sekarang
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Spacer bawah mobile */}
            <div className="h-8 sm:hidden"></div>
        </div>
    );
}