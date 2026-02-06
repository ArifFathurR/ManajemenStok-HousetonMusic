import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { LockClosedIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        // Container Utama: Menggunakan flex untuk memposisikan card di tengah layar
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 sm:p-0 font-sans">
            <Head title="Log in" />

            {/* CARD WRAPPER RESPONSIF:
                - Mobile: mx-6 memberikan jarak di samping kiri-kanan.
                - Desktop (sm:): mx-0 dan max-w-md membatasi lebar kartu agar tidak melebar.
                - shadow-2xl: Memberikan efek kedalaman seperti pada gambar.
            */}
            <div className="w-full mx-6 sm:mx-0 sm:max-w-md bg-white shadow-2xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100/50 overflow-hidden transition-all duration-300">
                
                <div className="px-6 py-10 sm:px-10">
                    
                    {/* Header: Logo dan Teks Selamat Datang */}
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-gray-100 border border-gray-50 mb-6 mx-auto overflow-hidden">
                            <img
                                src="/images/logo-houston.png"
                                alt="Houston Music"
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Selamat Datang</h1>
                        <p className="text-gray-500 text-base mt-2">Masuk untuk melanjutkan ke Dashboard</p>
                    </motion.div>

                    {status && (
                        <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 text-sm font-bold text-green-700 shadow-sm text-center">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        {/* Group Email */}
                        <div className="space-y-1.5">
                            <InputLabel htmlFor="email" value="Email" className="text-gray-900 font-bold ml-1" />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <TextInput
                                    id="email"
                                    type="email"
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-base shadow-inner"
                                    value={data.email}
                                    placeholder="nama@email.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2 ml-2" />
                        </div>

                        {/* Group Password */}
                        <div className="space-y-1.5">
                            <InputLabel htmlFor="password" value="Password" className="text-gray-900 font-bold ml-1" />
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                                </div>
                                <TextInput
                                    id="password"
                                    type="password"
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-2 focus:ring-gray-900 transition-all text-base shadow-inner"
                                    value={data.password}
                                    placeholder="••••••••"
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                            </div>
                            <InputError message={errors.password} className="mt-2 ml-2" />
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center cursor-pointer group">
                                <Checkbox
                                    name="remember"
                                    className="rounded-lg border-gray-300 text-gray-900 focus:ring-gray-900 w-6 h-6 transition-all"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span className="ms-3 text-sm font-bold text-gray-600 group-hover:text-gray-900">
                                    Ingat Saya
                                </span>
                            </label>
                            
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    Lupa?
                                </Link>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <PrimaryButton 
                                className="w-full flex justify-center items-center py-5 bg-gray-900 hover:bg-black text-white rounded-[1.25rem] shadow-xl shadow-gray-200 active:scale-95 transition-all font-bold text-base uppercase tracking-widest" 
                                disabled={processing}
                            >
                                {processing ? 'Memproses...' : 'Masuk Ke Akun'}
                            </PrimaryButton>
                        </div>

                        {/* Register Link */}
                        <div className="text-center mt-6">
                            <p className="text-gray-500 text-sm font-medium">
                                Belum memiliki akun?{' '}
                                <Link href={route('register')} className="text-gray-900 font-extrabold hover:underline underline-offset-4">
                                    Daftar Sekarang
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>

            {/* Footer tambahan untuk menjaga jarak di mobile */}
            <div className="h-8 sm:hidden"></div>
        </div>
    );
}