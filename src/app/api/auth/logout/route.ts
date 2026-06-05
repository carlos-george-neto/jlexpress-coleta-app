import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  try {
    const result = await signOut();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Não autenticado",
        },
        { status: 401 }
      );
    }

    // Criar response e limpar cookies
    const response = NextResponse.json(
      {
        success: true,
      },
      { status: 200 }
    );

    const clearCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 0,
    };

    // Limpar cookies de autenticação
    response.cookies.set("auth-token", "", clearCookieOptions);
    response.cookies.set("refresh-token", "", clearCookieOptions);

    return response;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao fazer logout",
      },
      { status: 500 }
    );
  }
}
