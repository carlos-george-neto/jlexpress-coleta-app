import { supabase } from "@/lib/supabase/client";
import { User } from "@/lib/types/auth";

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

    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email || "",
        profileType: "coletor" as const,
        isActive: true,
        createdAt: data.user.created_at || new Date().toISOString(),
        updatedAt: data.user.updated_at || new Date().toISOString(),
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

    return {
      id: data.user.id,
      email: data.user.email || "",
      profileType: "coletor",
      isActive: true,
      createdAt: data.user.created_at || new Date().toISOString(),
      updatedAt: data.user.updated_at || new Date().toISOString(),
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
