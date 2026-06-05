import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas/auth";
import { signIn } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar schema
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "E-mail ou senha inválidos",
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Fazer login
    const result = await signIn(email, password);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "E-mail ou senha inválidos",
        },
        { status: 400 }
      );
    }

    // Criar response com cookies
    const response = NextResponse.json(
      {
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      { status: 200 }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 60 * 60 * 24 * 7,
    };

    response.cookies.set("auth-token", result.accessToken!, cookieOptions);
    response.cookies.set("user-role", result.role!, cookieOptions);
    response.cookies.set("refresh-token", result.refreshToken!, cookieOptions);

    return response;
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao conectar ao servidor",
      },
      { status: 500 }
    );
  }
}
