"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import { ShipmentWithStatus } from "@/lib/types/shipment";
import { ShipmentQuickViewModal } from "@/components/dashboard/ShipmentQuickViewModal";

interface CollectorDashboardProps {
  userFullName: string;
}

interface ShipmentCardProps {
  shipment: ShipmentWithStatus;
  onClick: () => void;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function ShipmentCard({ shipment, onClick }: ShipmentCardProps) {
  const color = shipment.shipment_status.indicative_color ?? "#6B7280";
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      aria-label={`Ver detalhes da encomenda ${shipment.code}`}
    >
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-semibold text-gray-900 text-sm leading-tight">{shipment.code}</span>
          <span
            className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full text-white leading-tight"
            style={{ backgroundColor: color }}
          >
            {shipment.shipment_status.name}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">{shipment.carrier}</p>
        <p className="text-sm text-gray-500 truncate">{shipment.destination}</p>
        <p className="text-xs text-gray-400 mt-2">Chegada: {formatDate(shipment.arrival_date)}</p>
      </div>
    </button>
  );
}

export function CollectorDashboard({ userFullName }: CollectorDashboardProps) {
  const [shipments, setShipments] = useState<ShipmentWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentWithStatus | null>(null);

  useEffect(() => {
    apiFetch("/api/dashboard/shipments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setShipments(data.data.items as ShipmentWithStatus[]);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const pendingGroup = shipments.filter(
    (s) => s.shipment_status.name.toLowerCase() === "pendente de coleta"
  );

  const otherGroups = new Map<string, ShipmentWithStatus[]>();
  for (const shipment of shipments) {
    if (shipment.shipment_status.name.toLowerCase() !== "pendente de coleta") {
      const name = shipment.shipment_status.name;
      if (!otherGroups.has(name)) otherGroups.set(name, []);
      otherGroups.get(name)!.push(shipment);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-gray-500 text-sm">Carregando encomendas...</p>
      </div>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Olá, {userFullName}</h1>

        {shipments.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">Nenhuma encomenda para exibir no momento.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {pendingGroup.length > 0 && (
              <section aria-label="Encomendas pendentes de coleta">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Pendente de Coleta ({pendingGroup.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pendingGroup.map((shipment) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      onClick={() => setSelectedShipment(shipment)}
                    />
                  ))}
                </div>
              </section>
            )}

            {Array.from(otherGroups.entries()).map(([statusName, items]) => (
              <section key={statusName} aria-label={`Encomendas com status ${statusName}`}>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  {statusName} ({items.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((shipment) => (
                    <ShipmentCard
                      key={shipment.id}
                      shipment={shipment}
                      onClick={() => setSelectedShipment(shipment)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {selectedShipment !== null && (
        <ShipmentQuickViewModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
        />
      )}
    </>
  );
}
