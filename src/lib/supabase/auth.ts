import { supabase } from "@/lib/supabase/client";
import { User } from "@/lib/types/auth";

/**
 * Atualiza o timestamp de último login do usuário
 */
async function updateLastLogin(userId: string): Promise<void> {
  try {
    await supabase
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);
  } catch (error) {
    console.error("Erro ao atualizar último login:", error);
    // Não falha o login se não conseguir atualizar última data
  }
}

/**
 * Mapeia o campo `role` da tabela public.users para `profileType`
 */
function mapRoleToProfileType(
  role: string
): "admin" | "coletor" {
  switch (role) {
    case "admin":
      return "admin";
    case "collector":
    case "deliverer":
    case "user":
    default:
      return "coletor";
  }
}

/**
 * Busca dados do usuário na tabela public.users
 */
async function fetchUserProfile(userId: string): Promise<{
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
} | null> {
  try {
    
    const { data, error } = await supabase
      .schema("public")
      .from("users")
      .select("id, email, full_name, role, is_active, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("Erro ao buscar perfil do usuário:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    return null;
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: "E-mail ou senha inválidos" };
    }

    if (!data.user) {
      return { success: false, error: "Falha ao autenticar" };
    }

    // Buscar perfil do usuário na tabela public.users
    const userProfile = await fetchUserProfile(data.user.id);

    if (!userProfile || !userProfile.is_active) {
      return { success: false, error: "Usuário inativo ou não encontrado" };
    }

    // Atualizar último login
    await updateLastLogin(data.user.id);

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || "",
        fullName: userProfile.full_name,
        profileType: mapRoleToProfileType(userProfile.role),
        isActive: userProfile.is_active,
        createdAt: userProfile.created_at || new Date().toISOString(),
        updatedAt: userProfile.updated_at || new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return { success: false, error: "Falha ao conectar ao servidor" };
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return { success: false, error: "Falha ao fazer logout" };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    // Buscar perfil do usuário na tabela public.users
    const userProfile = await fetchUserProfile(data.user.id);

    if (!userProfile || !userProfile.is_active) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email || "",
      fullName: userProfile.full_name,
      profileType: mapRoleToProfileType(userProfile.role),
      isActive: userProfile.is_active,
      createdAt: userProfile.created_at || new Date().toISOString(),
      updatedAt: userProfile.updated_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Erro ao obter usuário atual:", error);
    return null;
  }
}

export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      return { success: false, error: "Falha ao renovar sessão" };
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao renovar sessão:", error);
    return { success: false, error: "Falha ao renovar sessão" };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password`,
    });

    if (error) {
      // Retorna mensagem genérica por segurança
      return { success: true, message: "E-mail de redefinição enviado" };
    }

    return { success: true, message: "E-mail de redefinição enviado" };
  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error);
    return { success: true, message: "E-mail de redefinição enviado" };
  }
}

export async function resetPasswordWithToken(token: string, password: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return { success: false, error: "Falha ao redefinir senha" };
    }

    return { success: true, message: "Senha redefinida com sucesso" };
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return { success: false, error: "Falha ao redefinir senha" };
  }
}
