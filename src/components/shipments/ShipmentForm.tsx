"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CollectorCombobox } from "@/components/shipments/CollectorCombobox";
import { apiFetch } from "@/lib/api/client";
import { ShipmentWithStatus } from "@/lib/types/shipment";

interface StatusOption {
  id: string;
  name: string;
  requires_observation: boolean;
  is_exception: boolean;
}

interface ShipmentFormData {
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
}

interface Props {
  mode: "create" | "edit";
  shipment?: ShipmentWithStatus;
  onSubmit: (data: ShipmentFormData) => Promise<void>;
  isLoading?: boolean;
}

export function ShipmentForm({ mode, shipment, onSubmit, isLoading = false }: Props) {
  const [code, setCode] = useState(shipment?.code ?? "");
  const [carrier, setCarrier] = useState(shipment?.carrier ?? "");
  const [volumeCount, setVolumeCount] = useState(shipment?.volume_count?.toString() ?? "");
  const [arrivalDate, setArrivalDate] = useState(shipment?.arrival_date ?? "");
  const [pickupDate, setPickupDate] = useState(shipment?.pickup_date ?? "");
  const [destination, setDestination] = useState(shipment?.destination ?? "");
  const [responsible, setResponsible] = useState(shipment?.responsible ?? "");
  const [statusId, setStatusId] = useState(shipment?.status_id ?? "");
  const [observations, setObservations] = useState(shipment?.observations ?? "");
  const [collectedCount, setCollectedCount] = useState(
    shipment?.collected_count?.toString() ?? ""
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
          if (mode === "create" && items.length > 0) {
            setStatusId(items[0].id);
            setSelectedStatus(items[0]);
          } else {
            const current = items.find((s) => s.id === (shipment?.status_id ?? "")) ?? null;
            setSelectedStatus(current);
          }
        }
      })
      .catch(() => {});
  }, [mode, shipment?.status_id]);

  function handleStatusChange(id: string) {
    setStatusId(id);
    const found = statuses.find((s) => s.id === id) ?? null;
    setSelectedStatus(found);
    if (!found?.requires_observation) setObservations("");
    if (!found?.is_exception) setCollectedCount("");
    setErrors((prev) => ({ ...prev, status_id: "", observations: "", collected_count: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "Código é obrigatório";
    if (!carrier.trim()) errs.carrier = "Transportadora é obrigatória";
    const vol = parseInt(volumeCount, 10);
    if (!volumeCount || isNaN(vol) || vol < 1) errs.volume_count = "Quantidade de volumes deve ser >= 1";
    if (!arrivalDate) errs.arrival_date = "Data de chegada é obrigatória";
    if (pickupDate && pickupDate < arrivalDate) errs.pickup_date = "Data de coleta deve ser >= data de chegada";
    if (!destination.trim()) errs.destination = "Destino é obrigatório";
    if (!responsible.trim()) errs.responsible = "Responsável é obrigatório";
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
        } else if (!isNaN(vol) && cc > vol) {
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
      code: code.trim(),
      carrier: carrier.trim(),
      volume_count: parseInt(volumeCount, 10),
      arrival_date: arrivalDate,
      pickup_date: pickupDate,
      destination: destination.trim(),
      responsible: responsible.trim(),
      status_id: statusId,
      observations,
      collected_count: collectedCount,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          type="text"
          label="Código"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ex.: ENC-001"
          error={errors.code}
          disabled={isLoading}
          required
        />
        <Input
          type="text"
          label="Transportadora"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          placeholder="Ex.: Transportes XYZ"
          error={errors.carrier}
          disabled={isLoading}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Input
          type="number"
          label="Quantidade de Volumes"
          value={volumeCount}
          onChange={(e) => setVolumeCount(e.target.value)}
          placeholder="Ex.: 5"
          error={errors.volume_count}
          disabled={isLoading}
          min={1}
          required
        />
        <Input
          type="date"
          label="Data de Chegada"
          value={arrivalDate}
          onChange={(e) => setArrivalDate(e.target.value)}
          error={errors.arrival_date}
          disabled={isLoading}
          required
        />
        <Input
          type="date"
          label="Data de Coleta"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          error={errors.pickup_date}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          type="text"
          label="Destino"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Ex.: Armazém Central"
          error={errors.destination}
          disabled={isLoading}
          required
        />
        <CollectorCombobox
          value={responsible}
          onChange={(v) => {
            setResponsible(v);
            setErrors((prev) => ({ ...prev, responsible: "" }));
          }}
          disabled={isLoading}
          error={errors.responsible}
        />
      </div>

      {mode === "create" ? (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <div className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500">
            {selectedStatus?.name ?? "Pendente de Coleta"}
          </div>
          <p className="text-xs text-gray-400">
            Novas encomendas são cadastradas automaticamente com este status.
          </p>
        </div>
      ) : (
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
      )}

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
          required
        />
      )}

      <Button type="submit" isLoading={isLoading} disabled={isLoading} className="w-full mt-2">
        {mode === "create" ? "Cadastrar Encomenda" : "Salvar Alterações"}
      </Button>
    </form>
  );
}
