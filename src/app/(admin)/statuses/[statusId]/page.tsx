"use client";

import { useState, useEffect, use } from "react";
import { StatusForm } from "@/components/admin/statuses/StatusForm";
import { StatusBadge } from "@/components/admin/statuses/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { ShipmentStatus, ShipmentStatusAuditLog } from "@/lib/types/status";
import { apiFetch } from "@/lib/api/client";
import Link from "next/link";

interface StatusResponse {
  success: boolean;
  data: { status: ShipmentStatus };
}

interface AuditLogResponse {
  success: boolean;
  data: {
    items: ShipmentStatusAuditLog[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
}

const actionLabels: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DEACTIVATE: "Desativação",
  REACTIVATE: "Reativação",
};

export default function EditStatusPage({
  params,
}: {
  params: Promise<{ statusId: string }>;
}) {
  const { statusId } = use(params);
  const [status, setStatus] = useState<ShipmentStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<ShipmentStatusAuditLog[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const [statusRes, auditRes] = await Promise.all([
          apiFetch(`/api/statuses/${statusId}`),
          apiFetch(`/api/statuses/${statusId}/audit-log?limit=10`),
        ]);

        const statusData: StatusResponse = await statusRes.json();
        if (!statusData.success) {
          setError("Status não encontrado");
          setIsLoadingStatus(false);
          return;
        }
        setStatus(statusData.data.status);

        const auditData: AuditLogResponse = await auditRes.json();
        if (auditData.success) setAuditLogs(auditData.data.items);
      } catch {
        setError("Falha ao carregar status");
      } finally {
        setIsLoadingStatus(false);
      }
    }

    loadStatus();
  }, [statusId]);

  async function handleSubmit(data: {
    name: string;
    description: string;
    flow_order: number;
    requires_observation: boolean;
    is_exception: boolean;
    is_finalizer: boolean;
    indicative_color: string;
  }) {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiFetch(`/api/statuses/${statusId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          flow_order: data.flow_order,
          requires_observation: data.requires_observation,
          is_exception: data.is_exception,
          is_finalizer: data.is_finalizer,
          indicative_color: data.indicative_color || null,
        }),
      });

      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Erro ao salvar alterações");
        return;
      }

      setStatus(result.data.status);
      setSuccessMsg("Alterações salvas com sucesso");

      const auditRes = await apiFetch(`/api/statuses/${statusId}/audit-log?limit=10`);
      const auditData: AuditLogResponse = await auditRes.json();
      if (auditData.success) setAuditLogs(auditData.data.items);
    } catch {
      setError("Falha ao conectar ao servidor");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive() {
    if (!status) return;
    setIsToggling(true);
    setShowToggleConfirm(false);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiFetch(`/api/statuses/${statusId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !status.is_active }),
      });

      const result = await res.json();
      if (!result.success) {
        setError(result.message || "Erro ao alterar status");
        return;
      }

      setStatus(result.data.status);
      setSuccessMsg(result.data.status.is_active ? "Status reativado com sucesso" : "Status desativado com sucesso");

      const auditRes = await apiFetch(`/api/statuses/${statusId}/audit-log?limit=10`);
      const auditData: AuditLogResponse = await auditRes.json();
      if (auditData.success) setAuditLogs(auditData.data.items);
    } catch {
      setError("Falha ao conectar ao servidor");
    } finally {
      setIsToggling(false);
    }
  }

  if (isLoadingStatus) {
    return <div className="text-center py-10 text-gray-500">Carregando...</div>;
  }

  if (!status) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error || "Status não encontrado"}</p>
        <Link href="/statuses" className="text-blue-600 hover:text-blue-800">
          Voltar à listagem
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/statuses"
          className="text-sm text-blue-600 hover:text-blue-800"
          aria-label="Voltar para a listagem de status"
        >
          ← Voltar
        </Link>
        <Typography variant="h2">Editar Status</Typography>
        <span className="ml-auto">
          <StatusBadge status={status} />
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

      <Card className="p-6">
        <Typography variant="h3" className="mb-4">
          Dados do Status
        </Typography>
        <StatusForm
          mode="edit"
          status={status}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Card>

      <Card className="p-6">
        <Typography variant="h3" className="mb-4">
          Ações
        </Typography>
        {!showToggleConfirm ? (
          <Button
            variant={status.is_active ? "secondary" : "primary"}
            onClick={() => setShowToggleConfirm(true)}
            disabled={isToggling}
            className={status.is_active ? "text-red-600 hover:text-red-800" : ""}
            aria-label={status.is_active ? "Desativar este status" : "Reativar este status"}
          >
            {status.is_active ? "Desativar Status" : "Reativar Status"}
          </Button>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
            <span className="text-sm text-yellow-800">
              {status.is_active ? "Desativar este status?" : "Reativar este status?"}
            </span>
            <Button
              onClick={handleToggleActive}
              isLoading={isToggling}
              aria-label="Confirmar ação"
            >
              Confirmar
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowToggleConfirm(false)}
              aria-label="Cancelar ação"
            >
              Cancelar
            </Button>
          </div>
        )}
      </Card>

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
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
