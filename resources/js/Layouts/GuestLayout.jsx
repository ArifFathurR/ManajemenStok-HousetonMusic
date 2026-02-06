import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        // Gunakan bg-gray-50 agar kontras dengan card putih lebih lembut
        <div className="flex min-h-screen flex-col items-center bg-gray-50 pt-6 sm:justify-center sm:pt-0">
            <div>
                {/* Logo luar jika diperlukan */}
            </div>

            {/* PERUBAHAN UTAMA:
              1. mx-6: Memberikan jarak di kiri & kanan pada mobile.
              2. w-auto: Membiarkan lebar menyesuaikan margin (atau gunakan w-full dengan mx).
              3. rounded-[2.5rem]: Menyamakan kelengkungan dengan desain yang Anda inginkan.
              4. shadow-xl: Memberikan kedalaman agar card terlihat elegan.
            */}
            <div className="mt-6 w-full sm:max-w-md overflow-hidden bg-white px-8 py-10 shadow-2xl shadow-gray-200/60 mx-6 sm:mx-0 rounded-[2.5rem] border border-gray-100/50">
                {children}
            </div>
            
            {/* Spacer bawah untuk mobile agar tidak mepet ke dasar layar */}
            <div className="h-10 sm:hidden"></div>
        </div>
    );
}