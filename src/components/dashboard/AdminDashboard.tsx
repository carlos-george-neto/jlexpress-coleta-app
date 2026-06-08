"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { ActivityByDate, ShipmentSummary } from "@/lib/types/dashboard";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function ShipmentRow({ shipment }: { shipment: ShipmentSummary }) {
  const color = shipment.indicative_color ?? "#6B7280";
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900">{shipment.code}</p>
          <p className="text-xs text-gray-500 truncate">{shipment.carrier} · {shipment.destination}</p>
          {shipment.observations && (
            <p className="text-xs text-gray-400 truncate">{shipment.observations}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {shipment.status_name}
        </span>
        <Link
          href={`/encomendas/${shipment.id}`}
          aria-label={`Editar encomenda ${shipment.code}`}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
        >
          Editar
        </Link>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [activities, setActivities] = useState<ActivityByDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/dashboard/activities")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setActivities(data.data.activities as ActivityByDate[]);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-gray-500 text-sm">Carregando atividades...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Painel Administrativo</h1>

      {activities.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Nenhuma atividade registrada.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activities.map((group) => (
            <section key={group.arrival_date} aria-label={`Atividades de ${formatDate(group.arrival_date)}`}>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                {formatDate(group.arrival_date)}
              </h2>
              <div className="space-y-4">
                {group.entries.map((entry) => (
                  <div
                    key={entry.collector}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-800">{entry.collector}</p>
                      <p className="text-xs text-gray-500">{entry.shipments.length} encomenda(s)</p>
                    </div>
                    <div className="px-4">
                      {entry.shipments.map((shipment) => (
                        <ShipmentRow key={shipment.id} shipment={shipment} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
