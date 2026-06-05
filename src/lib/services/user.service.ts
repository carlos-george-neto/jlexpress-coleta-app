import { supabaseAdmin } from "@/lib/supabase/admin";
import { UserRecord, ListUsersQuery, PaginationMeta } from "@/lib/types/user";
import { logUserAudit } from "./audit.service";

export interface CreateUserParams {
  email: string;
  full_name: string;
  role: string;
  password: string;
  performedBy: string;
  ipAddress?: string | null;
}

export interface UpdateUserParams {
  email?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
  performedBy: string;
  ipAddress?: string | null;
}

export interface ListUsersResult {
  items: UserRecord[];
  pagination: PaginationMeta;
}

export async function createUser(params: CreateUserParams): Promise<UserRecord> {
  const emailLower = params.email.toLowerCase();

  // Check email uniqueness (case-insensitive)
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .ilike("email", emailLower)
    .maybeSingle();

  if (existing) {
    throw Object.assign(new Error("Email já cadastrado no sistema"), { code: "EMAIL_ALREADY_EXISTS" });
  }

  // Create user in auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: emailLower,
    password: params.password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || "Falha ao criar usuário no Auth");
  }

  // Create user in public.users
  const { data: user, error: dbError } = await supabaseAdmin
    .from("users")
    .insert({
      id: authData.user.id,
      email: emailLower,
      full_name: params.full_name,
      role: params.role,
      is_active: true,
      created_by: params.performedBy,
      updated_by: params.performedBy,
    })
    .select()
    .single();

  if (dbError || !user) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new Error(dbError?.message || "Falha ao criar perfil do usuário");
  }

  // Audit log: CREATE
  await logUserAudit({
    userId: user.id,
    action: "CREATE",
    performedBy: params.performedBy,
    newData: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, is_active: user.is_active },
    ipAddress: params.ipAddress,
  });

  return user as UserRecord;
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as UserRecord | null;
}

export async function updateUser(
  userId: string,
  params: UpdateUserParams
): Promise<UserRecord> {
  const current = await getUserById(userId);
  if (!current) {
    throw Object.assign(new Error("Usuário não encontrado"), { code: "USER_NOT_FOUND" });
  }

  const updates: Record<string, unknown> = { updated_by: params.performedBy };

  if (params.email !== undefined) {
    const emailLower = params.email.toLowerCase();
    // Check email uniqueness excluding current user
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .ilike("email", emailLower)
      .neq("id", userId)
      .maybeSingle();

    if (existing) {
      throw Object.assign(new Error("Email já está cadastrado para outro usuário"), { code: "EMAIL_ALREADY_EXISTS" });
    }
    updates.email = emailLower;

    // Sync email in auth.users
    await supabaseAdmin.auth.admin.updateUserById(userId, { email: emailLower });
  }

  if (params.full_name !== undefined) updates.full_name = params.full_name;
  if (params.role !== undefined) updates.role = params.role;
  if (params.is_active !== undefined) updates.is_active = params.is_active;

  const { data: updated, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Falha ao atualizar usuário");
  }

  // Audit log: UPDATE
  await logUserAudit({
    userId,
    action: "UPDATE",
    performedBy: params.performedBy,
    oldData: current as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
    ipAddress: params.ipAddress,
  });

  return updated as UserRecord;
}

export async function deactivateUser(
  userId: string,
  performedBy: string,
  reason?: string | null,
  ipAddress?: string | null
): Promise<UserRecord> {
  // Guard: prevent self-deactivation
  if (userId === performedBy) {
    throw Object.assign(new Error("Você não pode desativar sua própria conta"), { code: "SELF_DEACTIVATION_FORBIDDEN" });
  }

  const current = await getUserById(userId);
  if (!current) {
    throw Object.assign(new Error("Usuário não encontrado"), { code: "USER_NOT_FOUND" });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("users")
    .update({ is_active: false, updated_by: performedBy })
    .eq("id", userId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Falha ao desativar usuário");
  }

  // Audit log: DEACTIVATE
  await logUserAudit({
    userId,
    action: "DEACTIVATE",
    performedBy,
    oldData: current as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
    reason,
    ipAddress,
  });

  return updated as UserRecord;
}

export async function activateUser(
  userId: string,
  performedBy: string,
  ipAddress?: string | null
): Promise<UserRecord> {
  const current = await getUserById(userId);
  if (!current) {
    throw Object.assign(new Error("Usuário não encontrado"), { code: "USER_NOT_FOUND" });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("users")
    .update({ is_active: true, updated_by: performedBy })
    .eq("id", userId)
    .select()
    .single();

  if (error || !updated) {
    throw new Error(error?.message || "Falha ao ativar usuário");
  }

  // Audit log: ACTIVATE
  await logUserAudit({
    userId,
    action: "ACTIVATE",
    performedBy,
    oldData: current as unknown as Record<string, unknown>,
    newData: updated as unknown as Record<string, unknown>,
    ipAddress,
  });

  return updated as UserRecord;
}

export async function resetUserPassword(
  userId: string,
  performedBy: string,
  redirectUrl?: string | null,
  ipAddress?: string | null
): Promise<{ email: string }> {
  const user = await getUserById(userId);
  if (!user) {
    throw Object.assign(new Error("Usuário não encontrado"), { code: "USER_NOT_FOUND" });
  }

  const { error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: user.email,
    options: {
      redirectTo: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password`,
    },
  });

  if (error) {
    throw new Error(error.message || "Falha ao gerar link de reset de senha");
  }

  // Audit log: PASSWORD_RESET
  await logUserAudit({
    userId,
    action: "PASSWORD_RESET",
    performedBy,
    newData: { email: user.email },
    ipAddress,
  });

  return { email: user.email };
}

export async function listUsers(query: ListUsersQuery): Promise<ListUsersResult> {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    is_active,
    sort_by = "created_at",
    sort_order = "desc",
  } = query;

  let dbQuery = supabaseAdmin.from("users").select("*", { count: "exact" });

  if (search) {
    dbQuery = dbQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }
  if (role) dbQuery = dbQuery.eq("role", role);
  if (is_active !== undefined) dbQuery = dbQuery.eq("is_active", is_active);

  const ascending = sort_order === "asc";
  dbQuery = dbQuery.order(sort_by, { ascending });

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  dbQuery = dbQuery.range(from, to);

  const { data, error, count } = await dbQuery;

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    items: (data ?? []) as UserRecord[],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function validateEmail(
  email: string,
  excludeUserId?: string
): Promise<boolean> {
  const emailLower = email.toLowerCase();
  let query = supabaseAdmin.schema("public")
      .from("users")
      .select("id")
      .ilike("email", emailLower);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data } = await query.maybeSingle();
  return data === null;
}
