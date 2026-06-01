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

    // Limpar cookies de autenticação
    response.cookies.set("__Secure-auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });

    response.cookies.set("__Secure-refresh-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });

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
