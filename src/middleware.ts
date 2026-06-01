"use server";

import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard"];
const publicRoutes = ["/login", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("__Secure-auth-token")?.value;
  const pathname = request.nextUrl.pathname;

  // Se não tem token e tenta acessar rota protegida, redireciona para login
  if (!authToken && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Se tem token e tenta acessar rota pública, permite acesso
  if (authToken && publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Corresponde a todos os paths exceto:
     * - api (API routes)
     * - _next/static (arquivos static)
     * - _next/image (otimização de imagens)
     * - favicon.ico (arquivo de favicon)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
