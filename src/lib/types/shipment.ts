export type ShipmentAuditAction = "CREATE" | "FULL_UPDATE" | "STATUS_UPDATE" | "DELETE";

export interface Shipment {
  id: string;
  code: string;
  carrier: string;
  volume_count: number;
  arrival_date: string;
  pickup_date: string | null;
  destination: string;
  responsible: string;
  status_id: string;
  observations: string | null;
  collected_count: number | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentWithStatus extends Shipment {
  shipment_status: {
    id: string;
    name: string;
    indicative_color: string | null;
    is_exception: boolean;
    requires_observation: boolean;
    is_finalizer: boolean;
  };
}

export interface ShipmentAuditLog {
  id: number;
  shipment_id: string;
  action: ShipmentAuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: string;
  performed_by_email?: string;
  performed_at: string;
}

export interface ListShipmentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status_id?: string;
  carrier?: string;
  arrival_date_from?: string;
  arrival_date_to?: string;
  sort_by?: "arrival_date" | "pickup_date" | "carrier" | "status_id";
  sort_order?: "asc" | "desc";
}
