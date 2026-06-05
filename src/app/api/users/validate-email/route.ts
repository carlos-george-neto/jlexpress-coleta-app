import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { validateEmail } from "@/lib/services/user.service";
import { ApiErrors } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return ApiErrors.unauthorized();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const excludeUserId = searchParams.get("exclude_user_id") || undefined;

    if (!email) {
      return ApiErrors.validation({ fieldErrors: { email: ["Email é obrigatório"] } });
    }

    const available = await validateEmail(email, excludeUserId);

    return NextResponse.json({
      success: true,
      available,
      email,
      ...(available ? {} : { message: "Email já cadastrado" }),
    });
  } catch (err) {
    console.error("GET /api/users/validate-email error:", err);
    return ApiErrors.internal();
  }
}
