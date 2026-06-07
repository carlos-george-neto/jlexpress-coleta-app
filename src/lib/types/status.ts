export type StatusAuditAction = "CREATE" | "UPDATE" | "DEACTIVATE" | "REACTIVATE";

export interface ShipmentStatus {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  requires_observation: boolean;
  is_exception: boolean;
  is_finalizer: boolean;
  flow_order: number;
  indicative_color: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentStatusAuditLog {
  id: number;
  status_id: string;
  action: StatusAuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: string;
  performed_by_email?: string;
  performed_at: string;
}

export interface ListStatusQuery {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  is_exception?: boolean;
  is_finalizer?: boolean;
  sort_by?: "name" | "flow_order" | "created_at";
  sort_order?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
