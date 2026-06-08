import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  Shipment,
  ShipmentWithStatus,
  ShipmentAuditLog,
  ShipmentAuditAction,
  ListShipmentsQuery,
} from "@/lib/types/shipment";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

async function logShipmentAudit(params: {
  shipmentId: string;
  action: ShipmentAuditAction;
  performedBy: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("shipment_audit_log").insert({
      shipment_id: params.shipmentId,
      action: params.action,
      performed_by: params.performedBy,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
    });
    if (error) console.error("Erro ao registrar auditoria de encomenda:", error);
  } catch (err) {
    console.error("Erro ao registrar auditoria de encomenda:", err);
  }
}

export interface CreateShipmentParams {
  code: string;
  carrier: string;
  volume_count: number;
  arrival_date: string;
  pickup_date?: string | null;
  destination: string;
  responsible: string;
  status_id: string;
  observations?: string | null;
  collected_count?: number | null;
  performedBy: string;
}

export async function createShipment(params: CreateShipmentParams): Promise<Shipment> {
  const { data: existing } = await supabaseAdmin
    .from("shipments")
    .select("id")
    .eq("code", params.code)
    .eq("carrier", params.carrier)
    .maybeSingle();

  if (existing) {
    throw Object.assign(new Error("Código já cadastrado para esta transportadora"), {
      code: "DUPLICATE_CODE_CARRIER",
    });
  }

  const { data: status } = await supabaseAdmin
    .from("shipment_status")
    .select("id, is_active, requires_observation, is_exception")
    .eq("id", params.status_id)
    .maybeSingle();

  if (!status) {
    throw Object.assign(new Error("Status não encontrado"), { code: "STATUS_NOT_FOUND" });
  }
  if (!status.is_active) {
    throw Object.assign(new Error("Status selecionado não está ativo"), { code: "STATUS_INACTIVE" });
  }
  if (status.requires_observation && !params.observations?.trim()) {
    throw Object.assign(new Error("Observações são obrigatórias para este status"), {
      code: "VALIDATION_ERROR",
    });
  }
  if (status.is_exception && params.collected_count == null) {
    throw Object.assign(new Error("Quantidade coletada é obrigatória para este status"), {
      code: "VALIDATION_ERROR",
    });
  }
  if (
    status.is_exception &&
    params.collected_count != null &&
    params.collected_count > params.volume_count
  ) {
    throw Object.assign(
      new Error("Quantidade coletada não pode ser maior que a quantidade de volumes"),
      { code: "VALIDATION_ERROR" }
    );
  }

  const { data: shipment, error } = await supabaseAdmin
    .from("shipments")
    .insert({
      code: params.code,
      carrier: params.carrier,
      volume_count: params.volume_count,
      arrival_date: params.arrival_date,
      pickup_date: params.pickup_date ?? null,
      destination: params.destination,
      responsible: params.responsible,
      status_id: params.status_id,
      observations: params.observations ?? null,
      collected_count: params.collected_count ?? null,
      is_active: true,
      created_by: params.performedBy,
      updated_by: params.performedBy,
    })
    .select()
    .single();

  if (error || !shipment) {
    throw new Error(error?.message || "Falha ao criar encomenda");
  }

  logShipmentAudit({
    shipmentId: shipment.id,
    action: "CREATE",
    performedBy: params.performedBy,
    newData: shipment as unknown as Record<string, unknown>,
  });

  return shipment as Shipment;
}

export async function getShipmentById(id: string): Promise<ShipmentWithStatus | null> {
  const { data, error } = await supabaseAdmin
    .from("shipments")
    .select(
      "*, shipment_status(id, name, indicative_color, is_exception, requires_observation, is_finalizer)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ShipmentWithStatus | null;
}

export interface UpdateShipmentParams {
  code?: string;
  carrier?: string;
  volume_count?: number;
  arrival_date?: string;
  pickup_date?: string | null;
  destination?: string;
  responsible?: string;
  status_id?: string;
  observations?: string | null;
  collected_count?: number | null;
}

export async function updateShipment(
  id: string,
  params: UpdateShipmentParams,
  performedBy: string,
  role: "admin" | "collector"
): Promise<ShipmentWithStatus> {
  const current = await getShipmentById(id);
  if (!current) {
    throw Object.assign(new Error("Encomenda não encontrada"), { code: "NOT_FOUND" });
  }

  if (role === "collector") {
    const allowedKeys: (keyof UpdateShipmentParams)[] = ["status_id", "observations", "collected_count"];
    const disallowed = Object.keys(params).filter(
      (k) => !allowedKeys.includes(k as keyof UpdateShipmentParams)
    );
    if (disallowed.length > 0) {
      throw Object.assign(
        new Error("Coletor não tem permissão para alterar estes campos"),
        { code: "INSUFFICIENT_PERMISSIONS" }
      );
    }
  }

  const statusId = params.status_id ?? current.status_id;
  const { data: status } = await supabaseAdmin
    .from("shipment_status")
    .select("id, is_active, requires_observation, is_exception")
    .eq("id", statusId)
    .maybeSingle();

  if (!status) {
    throw Object.assign(new Error("Status não encontrado"), { code: "STATUS_NOT_FOUND" });
  }
  if (!status.is_active) {
    throw Object.assign(new Error("Status selecionado não está ativo"), { code: "STATUS_INACTIVE" });
  }

  const observations = params.observations !== undefined ? params.observations : current.observations;
  const collectedCount =
    params.collected_count !== undefined ? params.collected_count : current.collected_count;
  const volumeCount = params.volume_count ?? current.volume_count;

  if (status.requires_observation && !observations?.trim()) {
    throw Object.assign(new Error("Observações são obrigatórias para este status"), {
      code: "VALIDATION_ERROR",
    });
  }
  if (status.is_exception && collectedCount == null) {
    throw Object.assign(new Error("Quantidade coletada é obrigatória para este status"), {
      code: "VALIDATION_ERROR",
    });
  }
  if (status.is_exception && collectedCount != null && collectedCount > volumeCount) {
    throw Object.assign(
      new Error("Quantidade coletada não pode ser maior que a quantidade de volumes"),
      { code: "VALIDATION_ERROR" }
    );
  }

  if (role === "admin" && params.code !== undefined && params.carrier !== undefined) {
    const newCode = params.code ?? current.code;
    const newCarrier = params.carrier ?? current.carrier;
    if (newCode !== current.code || newCarrier !== current.carrier) {
      const { data: dup } = await supabaseAdmin
        .from("shipments")
        .select("id")
        .eq("code", newCode)
        .eq("carrier", newCarrier)
        .neq("id", id)
        .maybeSingle();
      if (dup) {
        throw Object.assign(new Error("Código já cadastrado para esta transportadora"), {
          code: "DUPLICATE_CODE_CARRIER",
        });
      }
    }
  }

  const updates: Record<string, unknown> = { updated_by: performedBy };
  if (role === "admin") {
    if (params.code !== undefined) updates.code = params.code;
    if (params.carrier !== undefined) updates.carrier = params.carrier;
    if (params.volume_count !== undefined) updates.volume_count = params.volume_count;
    if (params.arrival_date !== undefined) updates.arrival_date = params.arrival_date;
    if (params.pickup_date !== undefined) updates.pickup_date = params.pickup_date;
    if (params.destination !== undefined) updates.destination = params.destination;
    if (params.responsible !== undefined) updates.responsible = params.responsible;
  }
  if (params.status_id !== undefined) updates.status_id = params.status_id;
  if (params.observations !== undefined) updates.observations = params.observations;
  if (params.collected_count !== undefined) updates.collected_count = params.collected_count;

  const { data: updated, error } = await supabaseAdmin
    .from("shipments")
    .update(updates)
    .eq("id", id)
    .select(
      "*, shipment_status(id, name, indicative_color, is_exception, requires_observation, is_finalizer)"
    )
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Falha ao atualizar encomenda");
  }

  const action: ShipmentAuditAction = role === "admin" ? "FULL_UPDATE" : "STATUS_UPDATE";
  logShipmentAudit({
    shipmentId: id,
    action,
    performedBy,
    oldData: current as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
  });

  return updated as ShipmentWithStatus;
}

export async function softDeleteShipment(id: string, performedBy: string): Promise<void> {
  const current = await getShipmentById(id);
  if (!current) {
    throw Object.assign(new Error("Encomenda não encontrada"), { code: "NOT_FOUND" });
  }

  const { error } = await supabaseAdmin
    .from("shipments")
    .update({ is_active: false, updated_by: performedBy })
    .eq("id", id);

  if (error) throw new Error(error.message);

  logShipmentAudit({
    shipmentId: id,
    action: "DELETE",
    performedBy,
    oldData: current as unknown as Record<string, unknown>,
    newData: null,
  });
}

export async function listShipments(
  query: ListShipmentsQuery
): Promise<{ items: ShipmentWithStatus[]; pagination: PaginationMeta }> {
  const {
    page = 1,
    limit = 20,
    search,
    status_id,
    carrier,
    arrival_date_from,
    arrival_date_to,
    sort_by = "arrival_date",
    sort_order = "desc",
  } = query;

  let dbQuery = supabaseAdmin
    .from("shipments")
    .select(
      "*, shipment_status(id, name, indicative_color, is_exception, requires_observation, is_finalizer)",
      { count: "exact" }
    )
    .eq("is_active", true);

  if (search) {
    dbQuery = dbQuery.or(
      `code.ilike.%${search}%,carrier.ilike.%${search}%,destination.ilike.%${search}%,responsible.ilike.%${search}%`
    );
  }
  if (status_id) dbQuery = dbQuery.eq("status_id", status_id);
  if (carrier) dbQuery = dbQuery.eq("carrier", carrier);
  if (arrival_date_from) dbQuery = dbQuery.gte("arrival_date", arrival_date_from);
  if (arrival_date_to) dbQuery = dbQuery.lte("arrival_date", arrival_date_to);

  dbQuery = dbQuery.order(sort_by, { ascending: sort_order === "asc" });

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    items: (data ?? []) as ShipmentWithStatus[],
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function listShipmentAuditLog(
  shipmentId: string,
  page = 1,
  limit = 20
): Promise<{ items: ShipmentAuditLog[]; pagination: PaginationMeta }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from("shipment_audit_log")
    .select("*, users!performed_by(email)", { count: "exact" })
    .eq("shipment_id", shipmentId)
    .order("performed_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const items = (data ?? []).map((row) => ({
    id: row.id,
    shipment_id: row.shipment_id,
    action: row.action,
    old_data: row.old_data,
    new_data: row.new_data,
    performed_by: row.performed_by,
    performed_by_email: (row.users as { email?: string } | null)?.email,
    performed_at: row.performed_at,
  })) as ShipmentAuditLog[];

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
