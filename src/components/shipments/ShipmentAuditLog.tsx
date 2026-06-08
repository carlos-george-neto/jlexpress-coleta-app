"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import { ShipmentAuditLog as AuditLogEntry, ShipmentAuditAction } from "@/lib/types/shipment";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Props {
  shipmentId: string;
}

const ACTION_LABELS: Record<ShipmentAuditAction, string> = {
  CREATE: "Cadastro",
  FULL_UPDATE: "Edição Completa",
  STATUS_UPDATE: "Atualização de Status",
  DELETE: "Remoção",
};

const ACTION_COLORS: Record<ShipmentAuditAction, string> = {
  CREATE: "bg-green-100 text-green-700",
  FULL_UPDATE: "bg-blue-100 text-blue-700",
  STATUS_UPDATE: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DataDiff({
  oldData,
  newData,
}: {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
}) {
  if (!oldData && !newData) return null;

  if (!oldData && newData) {
    return (
      <details className="mt-2">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Ver dados criados
        </summary>
        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-40">
          {JSON.stringify(newData, null, 2)}
        </pre>
      </details>
    );
  }

  if (oldData && !newData) {
    return (
      <details className="mt-2">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Ver dados removidos
        </summary>
        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-40">
          {JSON.stringify(oldData, null, 2)}
        </pre>
      </details>
    );
  }

  if (oldData && newData) {
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    const changed: { key: string; before: unknown; after: unknown }[] = [];
    allKeys.forEach((key) => {
      const before = oldData[key];
      const after = newData[key];
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changed.push({ key, before, after });
      }
    });

    if (changed.length === 0) return null;

    return (
      <details className="mt-2">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          {changed.length} campo{changed.length !== 1 ? "s" : ""} alterado{changed.length !== 1 ? "s" : ""}
        </summary>
        <div className="mt-1 flex flex-col gap-1">
          {changed.map(({ key, before, after }) => (
            <div key={key} className="text-xs bg-gray-50 rounded p-2">
              <span className="font-medium text-gray-700">{key}:</span>{" "}
              <span className="text-red-600 line-through">{JSON.stringify(before)}</span>{" "}
              <span className="text-gray-400">→</span>{" "}
              <span className="text-green-700">{JSON.stringify(after)}</span>
            </div>
          ))}
        </div>
      </details>
    );
  }

  return null;
}

export function ShipmentAuditLog({ shipmentId }: Props) {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const res = await apiFetch(
          `/api/shipments/${shipmentId}/audit-log?page=${page}`
        );
        const data = await res.json();
        if (data.success) {
          setItems(data.data.items as AuditLogEntry[]);
          setPagination(data.data.pagination as PaginationMeta);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    },
    [shipmentId]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-gray-800 mb-4">Histórico de Auditoria</h3>

      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando histórico...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum evento registrado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((entry) => (
            <div
              key={entry.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[entry.action]}`}
                  >
                    {ACTION_LABELS[entry.action]}
                  </span>
                  <span className="text-sm text-gray-700">
                    {entry.performed_by_email ?? entry.performed_by}
                  </span>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap shrink-0">
                  {formatDateTime(entry.performed_at)}
                </span>
              </div>

              <DataDiff oldData={entry.old_data} newData={entry.new_data} />
            </div>
          ))}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
              <span>{pagination.total} evento{pagination.total !== 1 ? "s" : ""}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => load(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Página anterior do log de auditoria"
                >
                  ←
                </button>
                <span className="px-3 py-1">
                  {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => load(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Próxima página do log de auditoria"
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
