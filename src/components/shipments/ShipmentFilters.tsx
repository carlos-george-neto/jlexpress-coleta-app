"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/lib/api/client";

interface StatusOption {
  id: string;
  name: string;
}

interface FiltersState {
  search: string;
  status_id: string;
  carrier: string;
  arrival_date_from: string;
  arrival_date_to: string;
}

interface Props {
  initialFilters?: Partial<FiltersState>;
  onFiltersChange: (filters: FiltersState) => void;
}

export function ShipmentFilters({ initialFilters, onFiltersChange }: Props) {
  const [search, setSearch] = useState(initialFilters?.search ?? "");
  const [statusId, setStatusId] = useState(initialFilters?.status_id ?? "");
  const [carrier, setCarrier] = useState(initialFilters?.carrier ?? "");
  const [arrivalDateFrom, setArrivalDateFrom] = useState(initialFilters?.arrival_date_from ?? "");
  const [arrivalDateTo, setArrivalDateTo] = useState(initialFilters?.arrival_date_to ?? "");
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const isMounted = useRef(false);

  useEffect(() => {
    apiFetch("/api/shipment-status?is_active=true&limit=100&sort_by=flow_order&sort_order=asc")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStatuses(data.data.items as StatusOption[]);
      })
      .catch(() => {});
  }, []);

  const emit = useCallback(
    (values: FiltersState) => {
      onFiltersChange(values);
    },
    [onFiltersChange]
  );

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      emit({ search, status_id: statusId, carrier, arrival_date_from: arrivalDateFrom, arrival_date_to: arrivalDateTo });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusId, carrier, arrivalDateFrom, arrivalDateTo, emit]);

  function handleReset() {
    setSearch("");
    setStatusId("");
    setCarrier("");
    setArrivalDateFrom("");
    setArrivalDateTo("");
  }

  const hasFilters = search || statusId || carrier || arrivalDateFrom || arrivalDateTo;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, transportadora..."
          aria-label="Busca textual"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={statusId}
          onChange={(e) => setStatusId(e.target.value)}
          aria-label="Filtrar por status"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos os status</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          placeholder="Transportadora"
          aria-label="Filtrar por transportadora"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="arrival-date-from" className="text-xs font-medium text-gray-600">
            Data de chegada — início
          </label>
          <input
            id="arrival-date-from"
            type="date"
            value={arrivalDateFrom}
            onChange={(e) => setArrivalDateFrom(e.target.value)}
            aria-label="Data de chegada início"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="arrival-date-to" className="text-xs font-medium text-gray-600">
            Data de chegada — fim
          </label>
          <input
            id="arrival-date-to"
            type="date"
            value={arrivalDateTo}
            onChange={(e) => setArrivalDateTo(e.target.value)}
            aria-label="Data de chegada fim"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="self-start text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
