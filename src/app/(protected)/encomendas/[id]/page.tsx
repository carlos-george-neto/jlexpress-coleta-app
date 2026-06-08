"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api/client";
import { ShipmentForm } from "@/components/shipments/ShipmentForm";
import { ShipmentStatusUpdate } from "@/components/shipments/ShipmentStatusUpdate";
import { ShipmentAuditLog } from "@/components/shipments/ShipmentAuditLog";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { ShipmentWithStatus } from "@/lib/types/shipment";
import Link from "next/link";

export default function EncomendaDetalhe() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const shipmentId = params.id;

  const [role, setRole] = useState<string | null>(null);
  const [shipment, setShipment] = useState<ShipmentWithStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) { router.push("/login"); return; }
      supabase
        .from("users")
        .select("role, is_active")
        .eq("id", authUser.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile || !profile.is_active) { router.push("/login"); return; }
          setRole(profile.role as string);
        });
    });
  }, [router]);

  const loadShipment = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`);
      const data = await res.json();
      if (data.success) {
        setShipment(data.data.shipment as ShipmentWithStatus);
      } else {
        router.push("/encomendas");
      }
    } catch {
      router.push("/encomendas");
    } finally {
      setIsLoading(false);
    }
  }, [shipmentId, router]);

  useEffect(() => {
    if (role) loadShipment();
  }, [role, loadShipment]);

  async function handleAdminSubmit(data: {
    code: string;
    carrier: string;
    volume_count: number;
    arrival_date: string;
    pickup_date: string;
    destination: string;
    responsible: string;
    status_id: string;
    observations: string;
    collected_count: string;
  }) {
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: data.code,
          carrier: data.carrier,
          volume_count: data.volume_count,
          arrival_date: data.arrival_date,
          pickup_date: data.pickup_date || null,
          destination: data.destination,
          responsible: data.responsible,
          status_id: data.status_id,
          observations: data.observations || null,
          collected_count: data.collected_count !== "" ? parseInt(data.collected_count, 10) : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShipment(json.data.shipment as ShipmentWithStatus);
        setSuccessMsg("Encomenda atualizada com sucesso.");
      } else {
        setError(json.details?.message ?? json.message ?? "Erro ao salvar encomenda");
      }
    } catch {
      setError("Erro ao salvar encomenda. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCollectorSubmit(data: {
    status_id: string;
    observations: string | null;
    collected_count: number | null;
  }) {
    setIsSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setShipment(json.data.shipment as ShipmentWithStatus);
        setSuccessMsg("Status atualizado com sucesso.");
      } else {
        setError(json.details?.message ?? json.message ?? "Erro ao atualizar status");
      }
    } catch {
      setError("Erro ao atualizar status. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        router.push("/encomendas");
      } else {
        setError(json.message ?? "Erro ao remover encomenda");
        setShowDeleteModal(false);
      }
    } catch {
      setError("Erro ao remover encomenda. Tente novamente.");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!role || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/encomendas"
          className="text-sm text-blue-600 hover:text-blue-800"
          aria-label="Voltar para listagem de encomendas"
        >
          ← Voltar para Encomendas
        </Link>
        <div className="flex items-center justify-between mt-2">
          <Typography variant="h2">
            {role === "admin" ? "Editar Encomenda" : "Registrar Coleta"}
          </Typography>
          {role === "admin" && (
            <Button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5"
              aria-label="Remover encomenda"
            >
              Remover
            </Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {successMsg}
          </div>
        )}

        {role === "admin" ? (
          <ShipmentForm
            mode="edit"
            shipment={shipment}
            onSubmit={handleAdminSubmit}
            isLoading={isSaving}
          />
        ) : (
          <ShipmentStatusUpdate
            shipment={shipment}
            onSubmit={handleCollectorSubmit}
            isLoading={isSaving}
          />
        )}

        <ShipmentAuditLog shipmentId={shipmentId} />
      </Card>

      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 id="delete-modal-title" className="text-lg font-semibold text-gray-900 mb-2">
              Remover Encomenda
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Tem certeza que deseja remover a encomenda <strong>{shipment.code}</strong>? Esta
              ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirmar Remoção
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
