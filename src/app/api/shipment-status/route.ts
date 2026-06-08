import { NextRequest } from "next/server";
import { createStatus, listStatuses } from "@/lib/services/status.service";
import { apiCreated, apiPaginated, ApiErrors } from "@/lib/api/response";
import { resolveAdminUser, resolveAuthenticatedUser } from "@/lib/api/auth";

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAdminUser();
    if (!auth.ok) {
      return auth.reason === "UNAUTHENTICATED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
    }
    const admin = auth.profile;

    const body = await request.json();
    const { name, description, requires_observation, is_exception, is_finalizer, flow_order, indicative_color } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return ApiErrors.validation({ message: "Nome é obrigatório" });
    }
    if (flow_order === undefined || flow_order === null || typeof flow_order !== "number") {
      return ApiErrors.validation({ message: "Ordem do fluxo é obrigatória" });
    }
    if (indicative_color !== undefined && indicative_color !== null && !HEX_COLOR_RE.test(indicative_color)) {
      return ApiErrors.validation({ message: "Formato de cor inválido. Use #RRGGBB" });
    }

    const status = await createStatus({
      name: name.trim(),
      description: description ?? null,
      requires_observation: requires_observation ?? false,
      is_exception: is_exception ?? false,
      is_finalizer: is_finalizer ?? false,
      flow_order,
      indicative_color: indicative_color ?? null,
      performedBy: admin.id,
    });

    return apiCreated({ status });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "NAME_ALREADY_EXISTS") {
      return ApiErrors.validation({ message: "Nome já cadastrado para outro status" });
    }
    console.error("POST /api/shipment-status error:", err);
    return ApiErrors.internal();
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthenticatedUser();
    if (!auth.ok) return ApiErrors.unauthorized();
    const authUser = auth.profile;

    const { searchParams } = new URL(request.url);
    const isAdmin = authUser.role === "admin";

    const pageRaw = searchParams.get("page");
    const limitRaw = searchParams.get("limit");
    const search = searchParams.get("search") ?? undefined;
    const sortBy = (searchParams.get("sort_by") ?? "flow_order") as "name" | "flow_order" | "created_at";
    const sortOrder = (searchParams.get("sort_order") ?? "asc") as "asc" | "desc";

    const isActiveRaw = searchParams.get("is_active");
    const isExceptionRaw = searchParams.get("is_exception");
    const isFinalizerRaw = searchParams.get("is_finalizer");

    const page = pageRaw ? parseInt(pageRaw, 10) : 1;
    const limit = limitRaw ? Math.min(parseInt(limitRaw, 10), 100) : 10;

    const is_active = isActiveRaw !== null ? isActiveRaw === "true" : (isAdmin ? undefined : true);
    const is_exception = isExceptionRaw !== null ? isExceptionRaw === "true" : undefined;
    const is_finalizer = isFinalizerRaw !== null ? isFinalizerRaw === "true" : undefined;

    const result = await listStatuses({ page, limit, search, is_active, is_exception, is_finalizer, sort_by: sortBy, sort_order: sortOrder });
    return apiPaginated(result.items, result.pagination);
  } catch (err) {
    console.error("GET /api/shipment-status error:", err);
    return ApiErrors.internal();
  }
}
