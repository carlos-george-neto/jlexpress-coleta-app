import { createServerSupabaseClient, getServerUser } from "@/lib/supabase/server";

interface UserProfile {
  id: string;
  role: string;
  is_active: boolean;
}

type AuthResult =
  | { ok: true; profile: UserProfile }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" };

async function loadProfile(): Promise<{ user: { id: string } | null; profile: UserProfile | null }> {
  const user = await getServerUser();
  if (!user) return { user: null, profile: null };

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as UserProfile | null };
}

/**
 * Valida sessão e perfil admin.
 * - Sem sessão válida → reason: "UNAUTHENTICATED" (HTTP 401)
 * - Sessão válida mas sem permissão → reason: "FORBIDDEN" (HTTP 403)
 */
export async function resolveAdminUser(): Promise<AuthResult> {
  const { user, profile } = await loadProfile();
  if (!user) return { ok: false, reason: "UNAUTHENTICATED" };
  if (!profile || !profile.is_active || profile.role !== "admin") {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return { ok: true, profile };
}

/**
 * Valida apenas a sessão (qualquer role ativo).
 * - Sem sessão válida → reason: "UNAUTHENTICATED" (HTTP 401)
 */
export async function resolveAuthenticatedUser(): Promise<AuthResult> {
  const { user, profile } = await loadProfile();
  if (!user) return { ok: false, reason: "UNAUTHENTICATED" };
  if (!profile || !profile.is_active) return { ok: false, reason: "FORBIDDEN" };
  return { ok: true, profile };
}
