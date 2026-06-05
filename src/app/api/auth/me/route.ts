import { NextResponse } from "next/server";
import { getServerUser, createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/types/user";

export async function GET() {
  try {
    const authUser = await getServerUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: authUser.id,
          email: authUser.email,
          role: data.role as UserRole,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return NextResponse.json(
      { success: false, error: "Falha ao obter usuário" },
      { status: 500 }
    );
  }
}
