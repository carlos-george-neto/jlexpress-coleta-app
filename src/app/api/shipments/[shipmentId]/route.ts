import { NextRequest, NextResponse } from "next/server";
import {
  getShipmentById,
  updateShipment,
  softDeleteShipment,
} from "@/lib/services/shipment.service";
import { ApiErrors } from "@/lib/api/response";
import { resolveAdminUser, resolveAuthenticatedUser } from "@/lib/api/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const auth = await resolveAuthenticatedUser();
    if (!auth.ok) return ApiErrors.unauthorized();
    const authUser = auth.profile;

    const { shipmentId } = await params;
    const shipment = await getShipmentById(shipmentId);
    if (!shipment) return ApiErrors.notFound("Encomenda");

    return NextResponse.json({ success: true, data: { shipment } });
  } catch (err) {
    console.error("GET /api/shipments/[shipmentId] error:", err);
    return ApiErrors.internal();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const auth = await resolveAuthenticatedUser();
    if (!auth.ok) return ApiErrors.unauthorized();
    const authUser = auth.profile;

    const role = authUser.role;
    if (role !== "admin" && role !== "collector") {
      return ApiErrors.forbidden();
    }

    const { shipmentId } = await params;
    const body = await request.json();

    const updated = await updateShipment(
      shipmentId,
      body,
      authUser.id,
      role as "admin" | "collector"
    );

    return NextResponse.json({ success: true, data: { shipment: updated } });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "NOT_FOUND") return ApiErrors.notFound("Encomenda");
    if (error.code === "INSUFFICIENT_PERMISSIONS") return ApiErrors.forbidden();
    if (error.code === "DUPLICATE_CODE_CARRIER") {
      return ApiErrors.validation({ message: "Código já cadastrado para esta transportadora" });
    }
    if (error.code === "STATUS_INACTIVE") {
      return ApiErrors.validation({ message: "Status selecionado não está ativo" });
    }
    if (error.code === "VALIDATION_ERROR") {
      return ApiErrors.validation({ message: error.message });
    }
    console.error("PATCH /api/shipments/[shipmentId] error:", err);
    return ApiErrors.internal();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const auth = await resolveAdminUser();
    if (!auth.ok) {
      return auth.reason === "UNAUTHENTICATED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
    }
    const admin = auth.profile;

    const { shipmentId } = await params;
    await softDeleteShipment(shipmentId, admin.id);

    return NextResponse.json({ success: true, message: "Encomenda removida com sucesso" });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "NOT_FOUND") return ApiErrors.notFound("Encomenda");
    console.error("DELETE /api/shipments/[shipmentId] error:", err);
    return ApiErrors.internal();
  }
}
