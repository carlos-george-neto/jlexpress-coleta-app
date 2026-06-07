"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShipmentStatus } from "@/lib/types/status";

interface StatusFormData {
  name: string;
  description: string;
  flow_order: number;
  requires_observation: boolean;
  is_exception: boolean;
  is_finalizer: boolean;
  indicative_color: string;
}

interface Props {
  mode: "create" | "edit";
  status?: ShipmentStatus;
  onSubmit: (data: StatusFormData) => Promise<void>;
  isLoading?: boolean;
}

export function StatusForm({ mode, status, onSubmit, isLoading = false }: Props) {
  const [name, setName] = useState(status?.name ?? "");
  const [description, setDescription] = useState(status?.description ?? "");
  const [flowOrder, setFlowOrder] = useState(status?.flow_order?.toString() ?? "");
  const [requiresObservation, setRequiresObservation] = useState(status?.requires_observation ?? false);
  const [isException, setIsException] = useState(status?.is_exception ?? false);
  const [isFinalizer, setIsFinalizer] = useState(status?.is_finalizer ?? false);
  const [indicativeColor, setIndicativeColor] = useState(status?.indicative_color ?? "#6B7280");
  const [colorText, setColorText] = useState(status?.indicative_color ?? "#6B7280");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateColorText(value: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(value);
  }

  function handleColorPickerChange(value: string) {
    setIndicativeColor(value);
    setColorText(value);
    setErrors((prev) => ({ ...prev, indicative_color: "" }));
  }

  function handleColorTextChange(value: string) {
    setColorText(value);
    if (validateColorText(value)) {
      setIndicativeColor(value);
      setErrors((prev) => ({ ...prev, indicative_color: "" }));
    } else {
      setErrors((prev) => ({ ...prev, indicative_color: "Formato inválido. Use #RRGGBB" }));
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Nome é obrigatório";
    if (!flowOrder || isNaN(parseInt(flowOrder, 10)) || parseInt(flowOrder, 10) < 1) {
      newErrors.flow_order = "Ordem do fluxo deve ser um número inteiro positivo";
    }
    if (colorText && !validateColorText(colorText)) {
      newErrors.indicative_color = "Formato inválido. Use #RRGGBB";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: name.trim(),
      description,
      flow_order: parseInt(flowOrder, 10),
      requires_observation: requiresObservation,
      is_exception: isException,
      is_finalizer: isFinalizer,
      indicative_color: validateColorText(colorText) ? colorText : "",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        type="text"
        label="Nome"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex.: Em Trânsito"
        error={errors.name}
        disabled={isLoading}
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição opcional do status"
          disabled={isLoading}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <Input
        type="number"
        label="Ordem do Fluxo"
        value={flowOrder}
        onChange={(e) => setFlowOrder(e.target.value)}
        placeholder="Ex.: 8"
        error={errors.flow_order}
        disabled={isLoading}
        min={1}
        required
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Cor Indicativa</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={indicativeColor}
            onChange={(e) => handleColorPickerChange(e.target.value)}
            disabled={isLoading}
            aria-label="Selecionar cor indicativa"
            className="w-10 h-10 cursor-pointer rounded border border-gray-300 p-0.5"
          />
          <Input
            type="text"
            value={colorText}
            onChange={(e) => handleColorTextChange(e.target.value)}
            placeholder="#6B7280"
            error={errors.indicative_color}
            disabled={isLoading}
            maxLength={7}
            aria-label="Código hexadecimal da cor"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Opções</label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresObservation}
              onChange={(e) => setRequiresObservation(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Requer observação</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isException}
              onChange={(e) => setIsException(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Status de exceção</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFinalizer}
              onChange={(e) => setIsFinalizer(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-700">Finalizador de fluxo</span>
          </label>
        </div>
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full mt-2"
      >
        {mode === "create" ? "Criar Status" : "Salvar Alterações"}
      </Button>
    </form>
  );
}
