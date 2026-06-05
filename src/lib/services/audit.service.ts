import { supabaseAdmin } from "@/lib/supabase/admin";
import { AuditAction } from "@/lib/types/user";

export interface LogAuditParams {
  userId: string;
  action: AuditAction;
  performedBy: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  reason?: string | null;
  ipAddress?: string | null;
}

export async function logUserAudit(params: LogAuditParams): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("user_audit_log").insert({
      user_id: params.userId,
      action: params.action,
      performed_by: params.performedBy,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
      reason: params.reason ?? null,
      ip_address: params.ipAddress ?? null,
    });

    if (error) {
      console.error("Erro ao registrar auditoria:", error);
    }
  } catch (err) {
    console.error("Erro ao registrar auditoria:", err);
  }
}
