import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  PASSWORD_GATE_COOKIE_NAME,
  isPasswordCookieValid,
  sanitizeRedirectPath,
} from './lib/auth/password-gate'

const PUBLIC_FILE = /\.(.*)$/
const WHITELIST_PATHS = new Set(['/access'])

function isHtmlRequest(request: NextRequest): boolean {
  const acceptHeader = request.headers.get('accept')
  return Boolean(acceptHeader && acceptHeader.includes('text/html'))
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (WHITELIST_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  if (pathname === '/favicon.ico' || pathname === '/icon.svg') {
    return NextResponse.next()
  }

  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  if (!isHtmlRequest(request)) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(PASSWORD_GATE_COOKIE_NAME)?.value
  if (isPasswordCookieValid(cookie)) {
    return NextResponse.next()
  }

  const accessUrl = request.nextUrl.clone()
  accessUrl.pathname = '/access'
  accessUrl.search = ''

  const redirectTarget = sanitizeRedirectPath(`${pathname}${search}` || '/')
  if (redirectTarget !== '/') {
    accessUrl.searchParams.set('redirect', redirectTarget)
  }

  return NextResponse.redirect(accessUrl)
}

export const config = {
  matcher: ['/((?!api).*)'],
}
