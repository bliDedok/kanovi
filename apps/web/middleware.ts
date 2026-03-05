import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('kanovi_token')?.value;
  const role = request.cookies.get('kanovi_role')?.value; // Ambil data role
  const url = request.nextUrl.pathname;

  // 1. Belum login (tidak ada token) + mencoba buka halaman selain /login
  if (!token && url !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Sudah login + iseng mencoba buka halaman /login lagi
  if (token && url === '/login') {
    if (role === 'OWNER') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/pos', request.url)); 
    }
  }

  // 3. PROTEKSI KEAMANAN: Pegawai mencoba akses halaman Dashboard Owner
  if (token && role === 'PEGAWAI' && url.startsWith('/dashboard')) {
    // Lempar balik ke POS!
    return NextResponse.redirect(new URL('/pos', request.url));
  }

  // Jika semua aman, biarkan lewat
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};