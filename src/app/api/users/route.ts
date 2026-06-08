import { NextRequest } from "next/server";
import { createUserSchema, listUsersQuerySchema } from "@/lib/schemas/user";
import { createUser, listUsers } from "@/lib/services/user.service";
import { apiCreated, apiPaginated, ApiErrors } from "@/lib/api/response";
import { resolveAdminUser } from "@/lib/api/auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAdminUser();
    if (!auth.ok) {
      return auth.reason === "UNAUTHENTICATED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
    }
    const admin = auth.profile;

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return ApiErrors.validation(validation.error.flatten());
    }

    const ipAddress = request.headers.get("x-forwarded-for") || null;
    const user = await createUser({
      ...validation.data,
      performedBy: admin.id,
      ipAddress,
    });

    return apiCreated(user);
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "EMAIL_ALREADY_EXISTS") return ApiErrors.emailExists();
    console.error("POST /api/users error:", err);
    return ApiErrors.internal();
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAdminUser();
    if (!auth.ok) {
      return auth.reason === "UNAUTHENTICATED" ? ApiErrors.unauthorized() : ApiErrors.forbidden();
    }
    const admin = auth.profile;

    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());
    const validation = listUsersQuerySchema.safeParse(rawQuery);
    if (!validation.success) {
      return ApiErrors.validation(validation.error.flatten());
    }

    const result = await listUsers(validation.data);
    return apiPaginated(result.items, result.pagination);
  } catch (err) {
    console.error("GET /api/users error:", err);
    return ApiErrors.internal();
  }
}
