"use client";

import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ShipmentWithStatus } from "@/lib/types/shipment";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Props {
  shipments: ShipmentWithStatus[];
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  hasActiveFilters?: boolean;
}

function StatusBadge({ status }: { status: ShipmentWithStatus["shipment_status"] }) {
  const color = status.indicative_color ?? "#6B7280";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: color }}
    >
      {status.name}
    </span>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export function ShipmentList({ shipments, pagination, onPageChange, hasActiveFilters }: Props) {
  if (shipments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <PackageSearch size={48} strokeWidth={1.5} aria-hidden="true" />
        <p className="text-base font-medium text-gray-600">
          {hasActiveFilters ? "Nenhuma encomenda encontrada para os filtros aplicados." : "Nenhuma encomenda cadastrada ainda."}
        </p>
        <p className="text-sm">
          {hasActiveFilters ? "Tente ajustar ou limpar os filtros." : "As encomendas cadastradas aparecerão aqui."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Código</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Transportadora</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Destino</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Responsável</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Chegada</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Coleta</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr
                key={s.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/encomendas/${s.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                    aria-label={`Ver encomenda ${s.code}`}
                  >
                    {s.code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-700">{s.carrier}</td>
                <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{s.destination}</td>
                <td className="px-4 py-3 text-gray-700 hidden md:table-cell">{s.responsible}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.shipment_status} />
                </td>
                <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                  {formatDate(s.arrival_date)}
                </td>
                <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                  {formatDate(s.pickup_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>
            {pagination.total} encomenda{pagination.total !== 1 ? "s" : ""}
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
