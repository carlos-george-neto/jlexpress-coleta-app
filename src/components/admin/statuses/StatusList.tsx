"use client";

import { ShipmentStatus, PaginationMeta } from "@/lib/types/status";
import { StatusBadge } from "./StatusBadge";
import Link from "next/link";

interface Props {
  statuses: ShipmentStatus[];
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function StatusList({ statuses, pagination, onPageChange }: Props) {
  if (statuses.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        Nenhum status encontrado.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Ordem</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cor</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Situação</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((status) => (
              <tr
                key={status.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-gray-500 text-center w-16">{status.flow_order}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{status.name}</div>
                  {status.description && (
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{status.description}</div>
                  )}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {status.requires_observation && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded">
                        Requer obs.
                      </span>
                    )}
                    {status.is_finalizer && (
                      <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                        Finalizador
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {status.indicative_color ? (
                    <span
                      className="inline-block w-6 h-6 rounded-full border border-gray-200"
                      style={{ backgroundColor: status.indicative_color }}
                      title={status.indicative_color}
                      aria-label={`Cor ${status.indicative_color}`}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/statuses/${status.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                    aria-label={`Editar status ${status.name}`}
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            {pagination.total} registro{pagination.total !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              ←
            </button>
            <span className="px-3 py-1">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Próxima página"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
