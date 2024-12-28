import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const isAuthPage = request.nextUrl.pathname === '/'
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                            request.nextUrl.pathname.startsWith('/health')

    // Redirect to dashboard if logged in and trying to access login page
    if (isAuthPage && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Redirect to login if not logged in and trying to access protected route
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/', '/dashboard/:path*', '/health/:path*']
} 