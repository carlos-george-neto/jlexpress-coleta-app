import { NextResponse } from "next/server";
import { PaginationMeta } from "@/lib/types/user";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiCreated<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function apiMessage(message: string, data?: unknown, status = 200) {
  return NextResponse.json({ success: true, message, ...(data ? { data } : {}) }, { status });
}

export function apiPaginated<T>(
  items: T[],
  pagination: PaginationMeta,
  status = 200
) {
  return NextResponse.json(
    { success: true, data: { items, pagination } },
    { status }
  );
}

export function apiError(
  error: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    { success: false, error, message, ...(details ? { details } : {}) },
    { status }
  );
}

export const ApiErrors = {
  unauthorized: () =>
    apiError("UNAUTHORIZED", "Autenticação necessária", 401),
  forbidden: () =>
    apiError("INSUFFICIENT_PERMISSIONS", "Apenas administradores podem realizar esta ação", 403),
  notFound: (resource = "Recurso") =>
    apiError("NOT_FOUND", `${resource} não encontrado`, 404),
  userNotFound: () =>
    apiError("USER_NOT_FOUND", "Usuário não encontrado", 404),
  emailExists: () =>
    apiError("EMAIL_ALREADY_EXISTS", "Email já cadastrado no sistema", 409),
  validation: (details: unknown) =>
    apiError("VALIDATION_ERROR", "Dados inválidos", 400, details),
  internal: () =>
    apiError("INTERNAL_SERVER_ERROR", "Erro interno do servidor", 500),
  selfDeactivation: () =>
    apiError("SELF_DEACTIVATION_FORBIDDEN", "Você não pode desativar sua própria conta", 403),
};
