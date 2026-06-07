import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  ShipmentStatus,
  ShipmentStatusAuditLog,
  ListStatusQuery,
  PaginationMeta,
  StatusAuditAction,
} from "@/lib/types/status";

interface LogStatusAuditParams {
  statusId: string;
  action: StatusAuditAction;
  performedBy: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

async function logStatusAudit(params: LogStatusAuditParams): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("shipment_status_audit_log").insert({
      status_id: params.statusId,
      action: params.action,
      performed_by: params.performedBy,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
    });
    if (error) console.error("Erro ao registrar auditoria de status:", error);
  } catch (err) {
    console.error("Erro ao registrar auditoria de status:", err);
  }
}

export interface CreateStatusParams {
  name: string;
  description?: string | null;
  requires_observation?: boolean;
  is_exception?: boolean;
  is_finalizer?: boolean;
  flow_order: number;
  indicative_color?: string | null;
  performedBy: string;
}

export interface UpdateStatusParams {
  name?: string;
  description?: string | null;
  requires_observation?: boolean;
  is_exception?: boolean;
  is_finalizer?: boolean;
  flow_order?: number;
  indicative_color?: string | null;
  is_active?: boolean;
  performedBy: string;
}

export interface ListStatusResult {
  items: ShipmentStatus[];
  pagination: PaginationMeta;
}

export async function createStatus(params: CreateStatusParams): Promise<ShipmentStatus> {
  const { data: existing } = await supabaseAdmin
    .from("shipment_status")
    .select("id")
    .ilike("name", params.name)
    .maybeSingle();

  if (existing) {
    throw Object.assign(new Error("Nome já cadastrado para outro status"), {
      code: "NAME_ALREADY_EXISTS",
    });
  }

  const { data: status, error } = await supabaseAdmin
    .from("shipment_status")
    .insert({
      name: params.name,
      description: params.description ?? null,
      requires_observation: params.requires_observation ?? false,
      is_exception: params.is_exception ?? false,
      is_finalizer: params.is_finalizer ?? false,
      flow_order: params.flow_order,
      indicative_color: params.indicative_color ?? null,
      created_by: params.performedBy,
      updated_by: params.performedBy,
    })
    .select()
    .single();

  if (error || !status) {
    throw new Error(error?.message || "Falha ao criar status");
  }

  await logStatusAudit({
    statusId: status.id,
    action: "CREATE",
    performedBy: params.performedBy,
    newData: status as unknown as Record<string, unknown>,
  });

  return status as ShipmentStatus;
}

export async function getStatusById(statusId: string): Promise<ShipmentStatus | null> {
  const { data, error } = await supabaseAdmin
    .from("shipment_status")
    .select("*")
    .eq("id", statusId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ShipmentStatus | null;
}

export async function updateStatus(
  statusId: string,
  params: UpdateStatusParams
): Promise<ShipmentStatus> {
  const current = await getStatusById(statusId);
  if (!current) {
    throw Object.assign(new Error("Status não encontrado"), { code: "STATUS_NOT_FOUND" });
  }

  if (params.name !== undefined) {
    const { data: existing } = await supabaseAdmin
      .from("shipment_status")
      .select("id")
      .ilike("name", params.name)
      .neq("id", statusId)
      .maybeSingle();

    if (existing) {
      throw Object.assign(new Error("Nome já cadastrado para outro status"), {
        code: "NAME_ALREADY_EXISTS",
      });
    }
  }

  const updates: Record<string, unknown> = { updated_by: params.performedBy };

  if (params.name !== undefined) updates.name = params.name;
  if (params.description !== undefined) updates.description = params.description;
  if (params.requires_observation !== undefined) updates.requires_observation = params.requires_observation;
  if (params.is_exception !== undefined) updates.is_exception = params.is_exception;
  if (params.is_finalizer !== undefined) updates.is_finalizer = params.is_finalizer;
  if (params.flow_order !== undefined) updates.flow_order = params.flow_order;
  if (params.indicative_color !== undefined) updates.indicative_color = params.indicative_color;
  if (params.is_active !== undefined) updates.is_active = params.is_active;

  const { data: updated, error } = await supabaseAdmin
    .from("shipment_status")
    .update(updates)
    .eq("id", statusId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Falha ao atualizar status");
  }

  let action: StatusAuditAction = "UPDATE";
  if (params.is_active === false && current.is_active === true) action = "DEACTIVATE";
  if (params.is_active === true && current.is_active === false) action = "REACTIVATE";

  await logStatusAudit({
    statusId,
    action,
    performedBy: params.performedBy,
    oldData: current as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
  });

  return updated as ShipmentStatus;
}

export async function listStatuses(query: ListStatusQuery): Promise<ListStatusResult> {
  const {
    page = 1,
    limit = 10,
    search,
    is_active,
    is_exception,
    is_finalizer,
    sort_by = "flow_order",
    sort_order = "asc",
  } = query;

  let dbQuery = supabaseAdmin.from("shipment_status").select("*", { count: "exact" });

  if (search) {
    dbQuery = dbQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  if (is_active !== undefined) dbQuery = dbQuery.eq("is_active", is_active);
  if (is_exception !== undefined) dbQuery = dbQuery.eq("is_exception", is_exception);
  if (is_finalizer !== undefined) dbQuery = dbQuery.eq("is_finalizer", is_finalizer);

  dbQuery = dbQuery.order(sort_by, { ascending: sort_order === "asc" });

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    items: (data ?? []) as ShipmentStatus[],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function listStatusAuditLog(
  statusId: string,
  page = 1,
  limit = 20
): Promise<{ items: ShipmentStatusAuditLog[]; pagination: PaginationMeta }> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabaseAdmin
    .from("shipment_status_audit_log")
    .select("*, users!performed_by(email)", { count: "exact" })
    .eq("status_id", statusId)
    .order("performed_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  const items = (data ?? []).map((row) => ({
    id: row.id,
    status_id: row.status_id,
    action: row.action,
    old_data: row.old_data,
    new_data: row.new_data,
    performed_by: row.performed_by,
    performed_by_email: (row.users as { email?: string } | null)?.email,
    performed_at: row.performed_at,
  })) as ShipmentStatusAuditLog[];

  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
