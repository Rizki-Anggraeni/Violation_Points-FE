import { NextResponse } from 'next/server';

export function proxy(request) {
    // Ambil token dari cookies
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Jika tidak ada token, tendang balik ke halaman login
    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // Decode JWT payload (Edge runtime mendukung atob)
        const payloadBase64 = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payloadBase64));
        const userRole = decodedPayload.role;

        // 1. Pengecekan khusus untuk role 'orang_tua'
        if (userRole === 'orang_tua') {
            // Redirect mulus tanpa pesan error jika mengakses root /dashboard
            if (pathname === '/dashboard') {
                return NextResponse.redirect(new URL('/dashboard/wali-murid', request.url));
            }
            // Tampilkan error HANYA jika mencoba mengakses sub-halaman khusus peran lain (misal: /dashboard/teachers)
            if (pathname.startsWith('/dashboard/') && !pathname.startsWith('/dashboard/wali-murid')) {
                const url = new URL('/dashboard/wali-murid', request.url);
                url.searchParams.set('error', 'unauthorized');
                return NextResponse.redirect(url);
            }
            return NextResponse.next();
        } 
        
        // 2. Blokir akses ke URL /dashboard/wali-murid untuk role selain orang_tua
        if (pathname.startsWith('/dashboard/wali-murid')) {
            const url = new URL('/dashboard', request.url);
            url.searchParams.set('error', 'unauthorized');
            return NextResponse.redirect(url);
        }

        // 3. Matriks Pembatasan Akses URL berdasarkan Role
        const routeAccess = {
            '/dashboard/teachers': ['admin', 'guru_bk'],
            '/dashboard/presensi': ['admin', 'wali_kelas', 'sekretaris'],
            '/dashboard/violations': ['admin', 'guru_bk', 'wali_kelas', 'sekretaris'],
        };

        // 4. Proses Pengecekan URL saat ini dengan Matriks Akses
        for (const [route, allowedRoles] of Object.entries(routeAccess)) {
            if (pathname.startsWith(route)) {
                if (!allowedRoles.includes(userRole)) {
                    const url = new URL('/dashboard', request.url);
                    url.searchParams.set('error', 'unauthorized');
                    return NextResponse.redirect(url);
                }
            }
        }

        return NextResponse.next();
    } catch (error) {
        // Jika token tidak valid / rusak, tendang ke login dan hapus cookie
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: ['/dashboard/:path*'], // Middleware ini hanya berjalan untuk rute /dashboard dan sub-rutenya
};