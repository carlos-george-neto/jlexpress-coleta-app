import { NextRequest } from "next/server";
import { getStatusById, updateStatus } from "@/lib/services/status.service";
import { ApiErrors } from "@/lib/api/response";
import { NextResponse } from "next/server";
import { resolveAdminUser, resolveAuthenticatedUser } from "@/lib/api/auth";

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  try {
    const auth = await resolveAuthenticatedUser();
    if (!auth.ok) return ApiErrors.unauthorized();
    const authUser = auth.profile;

    const { statusId } = await params;
    const status = await getStatusById(statusId);
    if (!status) return ApiErrors.notFound("Status");

    return NextResponse.json({ success: true, data: { status } });
  } catch (err) {
    console.error("GET /api/shipment-status/[statusId] error:", err);
    return ApiErrors.internal();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  try {
    const auth = await resolveAdminUser();
    if (!auth.ok) {
      return auth.reason === "UNAUTHENTICATED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
    }
    const admin = auth.profile;

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
    console.error("PATCH /api/shipment-status/[statusId] error:", err);
    return ApiErrors.internal();
  }
}
