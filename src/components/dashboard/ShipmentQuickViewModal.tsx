"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { ShipmentWithStatus } from "@/lib/types/shipment";

interface ShipmentQuickViewModalProps {
  shipment: ShipmentWithStatus;
  onClose: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function ShipmentQuickViewModal({ shipment, onClose }: ShipmentQuickViewModalProps) {
  const color = shipment.shipment_status.indicative_color ?? "#6B7280";

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Visualização rápida da encomenda"
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{shipment.code}</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              {shipment.shipment_status.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Field label="Transportadora" value={shipment.carrier} />
          <Field label="Responsável" value={shipment.responsible} />
          <Field label="Destino" value={shipment.destination} />
          <Field label="Qtd. de Volumes" value={String(shipment.volume_count)} />
          <Field label="Data de Chegada" value={formatDate(shipment.arrival_date)} />
          <Field label="Data de Coleta" value={formatDate(shipment.pickup_date)} />
          {shipment.collected_count != null && (
            <Field label="Qtd. Coletada" value={String(shipment.collected_count)} />
          )}
          {shipment.observations && (
            <Field label="Observações" value={shipment.observations} />
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Fechar
          </button>
          <Link
            href={`/encomendas/${shipment.id}`}
            aria-label={`Editar encomenda ${shipment.code}`}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  );
}
