import GeneralLayout from '@/Layouts/GeneralLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { 
    UserCircleIcon, 
    KeyIcon, 
    ExclamationTriangleIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Edit({ auth, mustVerifyEmail, status }) {
    return (
        <GeneralLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                        <UserCircleIcon className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold leading-tight text-gray-900">
                            Pengaturan Profil
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">
                            Kelola informasi akun dan keamanan kata sandi Anda
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Profil" />

            <div className="py-4 space-y-6 pb-20">
                {/* Section: Informasi Profil */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <ShieldCheckIcon className="w-4 h-4 text-indigo-500" />
                                Informasi Publik
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                                Perbarui nama akun dan alamat email yang terdaftar pada sistem.
                            </p>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Section: Update Password */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <KeyIcon className="w-4 h-4 text-orange-500" />
                                Keamanan Akun
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                                Pastikan akun Anda menggunakan kata sandi yang panjang dan acak untuk tetap aman.
                            </p>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md">
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Section: Hapus Akun */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                Zona Berbahaya
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                                Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara permanen.
                            </p>
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-2xl border-l-4 border-l-red-500 transition-all hover:shadow-md">
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </GeneralLayout>
    );
}