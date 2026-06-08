import { NextRequest } from "next/server";
import { listShipmentAuditLog, getShipmentById } from "@/lib/services/shipment.service";
import { apiPaginated, ApiErrors } from "@/lib/api/response";
import { resolveAuthenticatedUser } from "@/lib/api/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const auth = await resolveAuthenticatedUser();
    if (!auth.ok) return ApiErrors.unauthorized();

    const { shipmentId } = await params;

    const shipment = await getShipmentById(shipmentId);
    if (!shipment) return ApiErrors.notFound("Encomenda");

    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const result = await listShipmentAuditLog(shipmentId, page, limit);
    return apiPaginated(result.items, result.pagination);
  } catch (err) {
    console.error("GET /api/shipments/[shipmentId]/audit-log error:", err);
    return ApiErrors.internal();
  }
}
