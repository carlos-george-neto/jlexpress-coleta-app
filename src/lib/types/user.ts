export type UserRole = "admin" | "collector" | "deliverer" | "user";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "PASSWORD_RESET"
  | "ACTIVATE"
  | "DEACTIVATE";

export interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface UserAuditLog {
  id: number;
  user_id: string;
  action: AuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: string;
  performed_by_email?: string;
  performed_at: string;
  reason: string | null;
  ip_address: string | null;
}

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  is_active?: boolean;
  sort_by?: "email" | "full_name" | "created_at" | "is_active";
  sort_order?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
