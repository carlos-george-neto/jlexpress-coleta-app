import { NextRequest } from "next/server";
import { createShipment, listShipments } from "@/lib/services/shipment.service";
import { apiCreated, apiPaginated, ApiErrors } from "@/lib/api/response";
import { resolveAdminUser, resolveAuthenticatedUser } from "@/lib/api/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAdminUser();
    if (!auth.ok) {
      return auth.reason === "UNAUTHENTICATED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
    }
    const admin = auth.profile;

    const body = await request.json();
    const {
      code,
      carrier,
      volume_count,
      arrival_date,
      pickup_date,
      destination,
      responsible,
      status_id,
      observations,
      collected_count,
    } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return ApiErrors.validation({ message: "Código é obrigatório" });
    }
    if (!carrier || typeof carrier !== "string" || !carrier.trim()) {
      return ApiErrors.validation({ message: "Transportadora é obrigatória" });
    }
    if (typeof volume_count !== "number" || !Number.isInteger(volume_count) || volume_count < 1) {
      return ApiErrors.validation({ message: "Quantidade de volumes deve ser inteiro >= 1" });
    }
    if (!arrival_date || typeof arrival_date !== "string") {
      return ApiErrors.validation({ message: "Data de chegada é obrigatória" });
    }
    if (pickup_date && typeof pickup_date === "string" && pickup_date < arrival_date) {
      return ApiErrors.validation({ message: "Data de coleta deve ser >= data de chegada" });
    }
    if (!destination || typeof destination !== "string" || !destination.trim()) {
      return ApiErrors.validation({ message: "Destino é obrigatório" });
    }
    if (!responsible || typeof responsible !== "string" || !responsible.trim()) {
      return ApiErrors.validation({ message: "Responsável é obrigatório" });
    }
    if (!status_id || typeof status_id !== "string") {
      return ApiErrors.validation({ message: "Status é obrigatório" });
    }

    const shipment = await createShipment({
      code: code.trim(),
      carrier: carrier.trim(),
      volume_count,
      arrival_date,
      pickup_date: pickup_date ?? null,
      destination: destination.trim(),
      responsible: responsible.trim(),
      status_id,
      observations: observations ?? null,
      collected_count: collected_count ?? null,
      performedBy: admin.id,
    });

    return apiCreated({ shipment });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "DUPLICATE_CODE_CARRIER") {
      return ApiErrors.validation({ message: "Código já cadastrado para esta transportadora" });
    }
    if (error.code === "STATUS_INACTIVE") {
      return ApiErrors.validation({ message: "Status selecionado não está ativo" });
    }
    if (error.code === "VALIDATION_ERROR") {
      return ApiErrors.validation({ message: error.message });
    }
    console.error("POST /api/shipments error:", err);
    return ApiErrors.internal();
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthenticatedUser();
    if (!auth.ok) return ApiErrors.unauthorized();
    const authUser = auth.profile;

    const { searchParams } = new URL(request.url);

    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit")
      ? Math.min(parseInt(searchParams.get("limit")!, 10), 100)
      : 20;
    const search = searchParams.get("search") ?? undefined;
    const status_id = searchParams.get("status_id") ?? undefined;
    const carrier = searchParams.get("carrier") ?? undefined;
    const arrival_date_from = searchParams.get("arrival_date_from") ?? undefined;
    const arrival_date_to = searchParams.get("arrival_date_to") ?? undefined;
    const sort_by = (searchParams.get("sort_by") ?? "arrival_date") as
      | "arrival_date"
      | "pickup_date"
      | "carrier"
      | "status_id";
    const sort_order = (searchParams.get("sort_order") ?? "desc") as "asc" | "desc";

    const result = await listShipments({
      page,
      limit,
      search,
      status_id,
      carrier,
      arrival_date_from,
      arrival_date_to,
      sort_by,
      sort_order,
    });

    return apiPaginated(result.items, result.pagination);
  } catch (err) {
    console.error("GET /api/shipments error:", err);
    return ApiErrors.internal();
  }
}
