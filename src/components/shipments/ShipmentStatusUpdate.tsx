"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api/client";
import { ShipmentWithStatus } from "@/lib/types/shipment";

interface StatusOption {
  id: string;
  name: string;
  requires_observation: boolean;
  is_exception: boolean;
}

interface StatusUpdateData {
  status_id: string;
  observations: string | null;
  collected_count: number | null;
}

interface Props {
  shipment: ShipmentWithStatus;
  onSubmit: (data: StatusUpdateData) => Promise<void>;
  isLoading?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function ShipmentStatusUpdate({ shipment, onSubmit, isLoading = false }: Props) {
  const [statusId, setStatusId] = useState(shipment.status_id);
  const [observations, setObservations] = useState(shipment.observations ?? "");
  const [collectedCount, setCollectedCount] = useState(
    shipment.collected_count?.toString() ?? ""
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusOption | null>(null);

  useEffect(() => {
    apiFetch("/api/shipment-status?is_active=true&limit=100&sort_by=flow_order&sort_order=asc")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const items = data.data.items as StatusOption[];
          setStatuses(items);
          setSelectedStatus(items.find((s) => s.id === shipment.status_id) ?? null);
        }
      })
      .catch(() => {});
  }, [shipment.status_id]);

  function handleStatusChange(id: string) {
    setStatusId(id);
    const found = statuses.find((s) => s.id === id) ?? null;
    setSelectedStatus(found);
    if (!found?.requires_observation) setObservations("");
    if (!found?.is_exception) setCollectedCount("");
    setErrors({});
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!statusId) errs.status_id = "Status é obrigatório";
    if (selectedStatus?.requires_observation && !observations.trim()) {
      errs.observations = "Observações são obrigatórias para este status";
    }
    if (selectedStatus?.is_exception) {
      if (collectedCount === "") {
        errs.collected_count = "Quantidade coletada é obrigatória para este status";
      } else {
        const cc = parseInt(collectedCount, 10);
        if (isNaN(cc) || cc < 0) {
          errs.collected_count = "Quantidade coletada deve ser >= 0";
        } else if (cc > shipment.volume_count) {
          errs.collected_count = "Quantidade coletada não pode ser maior que a quantidade de volumes";
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      status_id: statusId,
      observations: observations.trim() || null,
      collected_count: collectedCount !== "" ? parseInt(collectedCount, 10) : null,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
        <div>
          <p className="text-gray-500 text-xs mb-1">Código</p>
          <p className="font-medium text-gray-800">{shipment.code}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Transportadora</p>
          <p className="font-medium text-gray-800">{shipment.carrier}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Destino</p>
          <p className="font-medium text-gray-800">{shipment.destination}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Responsável</p>
          <p className="font-medium text-gray-800">{shipment.responsible}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Data de Chegada</p>
          <p className="font-medium text-gray-800">{formatDate(shipment.arrival_date)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Volumes</p>
          <p className="font-medium text-gray-800">{shipment.volume_count}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            value={statusId}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isLoading}
            className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
              errors.status_id ? "border-red-400" : "border-gray-300"
            }`}
          >
            <option value="">Selecione um status...</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.status_id && <p className="text-xs text-red-500 mt-1">{errors.status_id}</p>}
        </div>

        {selectedStatus?.requires_observation && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Observações <span className="text-red-500">*</span>
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Descreva as observações necessárias..."
              disabled={isLoading}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.observations ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.observations && (
              <p className="text-xs text-red-500 mt-1">{errors.observations}</p>
            )}
          </div>
        )}

        {selectedStatus?.is_exception && (
          <Input
            type="number"
            label="Quantidade Coletada"
            value={collectedCount}
            onChange={(e) => setCollectedCount(e.target.value)}
            placeholder="Ex.: 3"
            error={errors.collected_count}
            disabled={isLoading}
            min={0}
            max={shipment.volume_count}
            required
          />
        )}

        <Button type="submit" isLoading={isLoading} disabled={isLoading} className="w-full">
          Registrar Coleta
        </Button>
      </form>
    </div>
  );
}
