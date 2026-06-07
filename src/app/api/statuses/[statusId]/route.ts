import { NextRequest } from "next/server";
import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";
import { getStatusById, updateStatus } from "@/lib/services/status.service";
import { ApiErrors } from "@/lib/api/response";
import { NextResponse } from "next/server";

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

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

async function getAuthenticatedUser() {
  const user = await getServerUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) return null;
  return profile as { id: string; role: string; is_active: boolean };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser();
    if (!authUser) return ApiErrors.unauthorized();

    const { statusId } = await params;
    const status = await getStatusById(statusId);
    if (!status) return ApiErrors.notFound("Status");

    return NextResponse.json({ success: true, data: { status } });
  } catch (err) {
    console.error("GET /api/statuses/[statusId] error:", err);
    return ApiErrors.internal();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return ApiErrors.forbidden();

    const { statusId } = await params;
    const current = await getStatusById(statusId);
    if (!current) return ApiErrors.notFound("Status");

    const body = await request.json();
    const { name, description, requires_observation, is_exception, is_finalizer, flow_order, indicative_color, is_active } = body;

    if (indicative_color !== undefined && indicative_color !== null && !HEX_COLOR_RE.test(indicative_color)) {
      return ApiErrors.validation({ message: "Formato de cor inválido. Use #RRGGBB" });
    }

    const updated = await updateStatus(statusId, {
      name,
      description,
      requires_observation,
      is_exception,
      is_finalizer,
      flow_order,
      indicative_color,
      is_active,
      performedBy: admin.id,
    });

    return NextResponse.json({ success: true, data: { status: updated } });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "NAME_ALREADY_EXISTS") {
      return ApiErrors.validation({ message: "Nome já cadastrado para outro status" });
    }
    if (error.code === "STATUS_NOT_FOUND") {
      return ApiErrors.notFound("Status");
    }
    console.error("PATCH /api/statuses/[statusId] error:", err);
    return ApiErrors.internal();
  }
}
