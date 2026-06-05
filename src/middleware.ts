import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/admin", "/users"];
const adminRoutes = ["/admin", "/users"];
const publicRoutes = ["/login", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("__Secure-auth-token")?.value;
  const pathname = request.nextUrl.pathname;

  // Admin API routes: require auth token
  if (pathname.startsWith("/api/users")) {
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Se não tem token e tenta acessar rota protegida, redireciona para login
  if (!authToken && protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rotas admin: verificar role via cookie (definido no login)
  if (authToken && adminRoutes.some((route) => pathname.startsWith(route))) {
    const userRole = request.cookies.get("__Secure-user-role")?.value;
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
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
     * - _next/static (arquivos static)
     * - _next/image (otimização de imagens)
     * - favicon.ico (arquivo de favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
