"use client";

import { useState, useEffect, use } from "react";
import { UserForm } from "@/components/admin/users/UserForm";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { UserRecord, UserAuditLog, UserRole } from "@/lib/types/user";
import { apiFetch } from "@/lib/api/client";
import Link from "next/link";

interface AuditLogResponse {
  success: boolean;
  data: {
    items: UserAuditLog[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}

const actionLabels: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Remoção",
  PASSWORD_RESET: "Reset de Senha",
  ACTIVATE: "Ativação",
  DEACTIVATE: "Desativação",
};

export default function EditUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: UserRole } | null>(null);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCurrentUser({ id: data.user.id, role: data.user.role });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadUser() {
      try {
        const [userRes, auditRes] = await Promise.all([
          apiFetch(`/api/users/${userId}`),
          apiFetch(`/api/users/${userId}/audit-log?limit=10`),
        ]);

        const userData = await userRes.json();
        if (!userData.success) {
          setError("Usuário não encontrado");
          setIsLoadingUser(false);
          return;
        }
        setUser(userData.data);

        const auditData: AuditLogResponse = await auditRes.json();
        if (auditData.success) setAuditLogs(auditData.data.items);
      } catch {
        setError("Falha ao carregar usuário");
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadUser();
  }, [userId]);

  async function handleSubmit(data: { email?: string; full_name?: string; role?: string }) {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Erro ao salvar alterações");
        return;
      }

      setUser(result.data);
      setSuccessMsg("Alterações salvas com sucesso");
    } catch {
      setError("Falha ao conectar ao servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setIsResetting(true);
    setShowResetConfirm(false);
    setError(null);

    try {
      const res = await apiFetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Erro ao resetar senha");
        return;
      }

      setSuccessMsg("Link de reset de senha enviado por e-mail");
    } catch {
      setError("Falha ao conectar ao servidor");
    } finally {
      setIsResetting(false);
    }
  }

  async function handleToggleActive() {
    if (!user) return;
    setIsToggling(true);
    setShowToggleConfirm(false);
    setError(null);

    try {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactivate: user.is_active === false }),
      });

      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Erro ao alterar status do usuário");
        return;
      }

      setUser((prev) =>
        prev ? { ...prev, is_active: result.data.is_active } : null
      );
      setSuccessMsg(
        result.data.is_active ? "Usuário ativado com sucesso" : "Usuário desativado com sucesso"
      );
    } catch {
      setError("Falha ao conectar ao servidor");
    } finally {
      setIsToggling(false);
    }
  }

  if (isLoadingUser) {
    return <div className="text-center py-10 text-gray-500">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error || "Usuário não encontrado"}</p>
        <Link href="/users" className="text-blue-600 hover:text-blue-800">
          Voltar à listagem
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/users" className="text-sm text-blue-600 hover:text-blue-800">
          ← Voltar
        </Link>
        <Typography variant="h2">Editar Usuário</Typography>
        <span
          className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${
            user.is_active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {user.is_active ? "Ativo" : "Inativo"}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      {/* Edit form */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">
          Dados Cadastrais
        </Typography>
        <UserForm
          mode="edit"
          user={user}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">
          Ações
        </Typography>
        <div className="flex flex-wrap gap-3">
          {/* Reset Password */}
          {!showResetConfirm ? (
            <Button
              variant="secondary"
              onClick={() => setShowResetConfirm(true)}
              disabled={isResetting}
            >
              Resetar Senha
            </Button>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
              <span className="text-sm text-yellow-800">Enviar link de reset?</span>
              <Button onClick={handleResetPassword} isLoading={isResetting}>
                Confirmar
              </Button>
              <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>
                Cancelar
              </Button>
            </div>
          )}

          {/* Activate/Deactivate — oculto quando admin edita o próprio perfil */}
          {!(currentUser?.id === userId && currentUser?.role === "admin") && (
            !showToggleConfirm ? (
              <Button
                variant={user.is_active ? "secondary" : "primary"}
                onClick={() => setShowToggleConfirm(true)}
                disabled={isToggling}
                className={user.is_active ? "text-red-600 hover:text-red-800" : ""}
              >
                {user.is_active ? "Desativar Usuário" : "Ativar Usuário"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                <span className="text-sm text-yellow-800">
                  {user.is_active ? "Desativar este usuário?" : "Ativar este usuário?"}
                </span>
                <Button onClick={handleToggleActive} isLoading={isToggling}>
                  Confirmar
                </Button>
                <Button variant="secondary" onClick={() => setShowToggleConfirm(false)}>
                  Cancelar
                </Button>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Audit log */}
      <Card className="p-6">
        <Typography variant="h3" className="mb-4">
          Histórico de Auditoria
        </Typography>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum registro de auditoria.</p>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm"
              >
                <span className="font-medium text-gray-700 min-w-[120px]">
                  {actionLabels[log.action] ?? log.action}
                </span>
                <div className="flex-1 text-gray-600">
                  <span>por {log.performed_by_email ?? log.performed_by}</span>
                  <span className="ml-2 text-gray-400 text-xs">
                    {new Date(log.performed_at).toLocaleString("pt-BR")}
                  </span>
                  {log.reason && (
                    <p className="mt-1 text-gray-500 italic">{log.reason}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
