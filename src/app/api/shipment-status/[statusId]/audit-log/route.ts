import { NextRequest } from "next/server";
import { listStatusAuditLog } from "@/lib/services/status.service";
import { ApiErrors } from "@/lib/api/response";
import { NextResponse } from "next/server";
import { resolveAdminUser } from "@/lib/api/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ statusId: string }> }
) {
  try {
    const auth = await resolveAdminUser();
    if (!auth.ok) {
      return auth.reason === "UNAUTHENTICATED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
    }

    const { statusId } = await params;
    const { searchParams } = new URL(request.url);

    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? Math.min(parseInt(searchParams.get("limit")!, 10), 100) : 20;

    const result = await listStatusAuditLog(statusId, page, limit);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error("GET /api/shipment-status/[statusId]/audit-log error:", err);
    return ApiErrors.internal();
  }
}
