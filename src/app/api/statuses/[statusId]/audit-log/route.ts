import { NextRequest } from "next/server";
import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { listStatusAuditLog } from "@/lib/services/status.service";
import { ApiErrors } from "@/lib/api/response";
import { NextResponse } from "next/server";

async function getAdminUser() {
  const user = await getServerUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active || profile.role !== "admin") return null;
  return profile as { id: string; role: string; is_active: boolean };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return ApiErrors.forbidden();

    const { statusId } = await params;
    const { searchParams } = new URL(request.url);

    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? Math.min(parseInt(searchParams.get("limit")!, 10), 100) : 20;

    const result = await listStatusAuditLog(statusId, page, limit);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("GET /api/statuses/[statusId]/audit-log error:", err);
    return ApiErrors.internal();
  }
}
