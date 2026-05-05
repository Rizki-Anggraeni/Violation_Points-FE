import { NextResponse } from 'next/server';

export function middleware(request) {
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

        // Logika Pengecekan Role
        if (userRole === 'ortu') {
            // Jika role ortu mencoba akses /dashboard tapi BUKAN /dashboard/ortu, arahkan ke jalurnya
            if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/ortu')) {
                return NextResponse.redirect(new URL('/dashboard/ortu', request.url));
            }
        } else {
            // (Opsional) Jika user biasa/guru mencoba akses halaman khusus ortu, tendang ke dashboard utama
            if (pathname.startsWith('/dashboard/ortu')) {
                return NextResponse.redirect(new URL('/dashboard', request.url));
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