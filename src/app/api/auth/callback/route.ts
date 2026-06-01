import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    const type = request.nextUrl.searchParams.get("type");

    // Validar token
    if (!token || type !== "recovery") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirecionar para página de reset com token
    return NextResponse.redirect(
      new URL(`/reset-password?token=${encodeURIComponent(token)}`, request.url)
    );
  } catch (error) {
    console.error("Erro ao processar callback de reset:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
