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
      },
      { status: 200 }
    );

    // Configurar cookies de autenticação
    // Nota: Os cookies reais virão do Supabase, aqui é apenas exemplo
    response.cookies.set("__Secure-auth-token", "placeholder", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

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
