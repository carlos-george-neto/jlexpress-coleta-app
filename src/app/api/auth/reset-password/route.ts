import { NextRequest, NextResponse } from "next/server";
import { emailSchema } from "@/lib/schemas/auth";
import { requestPasswordReset } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar schema
    const validation = emailSchema.safeParse(body);
    if (!validation.success) {
      // Retornar mensagem genérica por segurança
      return NextResponse.json(
        {
          success: true,
          message: "E-mail de redefinição enviado",
        },
        { status: 200 }
      );
    }

    const { email } = validation.data;

    // Solicitar reset
    const result = await requestPasswordReset(email);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message || "E-mail de redefinição enviado",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao solicitar reset de senha:", error);
    // Retornar mensagem genérica por segurança
    return NextResponse.json(
      {
        success: true,
        message: "E-mail de redefinição enviado",
      },
      { status: 200 }
    );
  }
}
