"use client";

import { useState, useEffect, useCallback } from "react";
import { StatusList } from "@/components/admin/statuses/StatusList";
import { StatusFilters } from "@/components/admin/statuses/StatusFilters";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { ShipmentStatus, PaginationMeta } from "@/lib/types/status";
import Link from "next/link";

interface Filters {
  search: string;
  is_active: "" | "true" | "false";
  is_exception: "" | "true";
  is_finalizer: "" | "true";
}

interface ListResponse {
  success: boolean;
  data: {
    items: ShipmentStatus[];
    pagination: PaginationMeta;
  };
}

const defaultFilters: Filters = {
  search: "",
  is_active: "",
  is_exception: "",
  is_finalizer: "",
};

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<ShipmentStatus[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "10" });
        if (filters.search) params.set("search", filters.search);
        if (filters.is_active) params.set("is_active", filters.is_active);
        if (filters.is_exception) params.set("is_exception", filters.is_exception);
        if (filters.is_finalizer) params.set("is_finalizer", filters.is_finalizer);

        const res = await fetch(`/api/statuses?${params}`);
        const data: ListResponse = await res.json();

        if (!data.success) {
          setError("Erro ao carregar status");
          return;
        }

        setStatuses(data.data.items);
        setPagination(data.data.pagination);
      } catch {
        setError("Falha ao conectar ao servidor");
      } finally {
        setIsLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchStatuses(1);
  }, [fetchStatuses]);

  function handleFiltersChange(newFilters: Filters) {
    setFilters(newFilters);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography variant="h2">Status de Encomenda</Typography>
        <Link href="/statuses/new" aria-label="Criar novo status de encomenda">
          <Button>+ Novo Status</Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <StatusFilters filters={filters} onChange={handleFiltersChange} />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Carregando...</div>
        ) : (
          <StatusList
            statuses={statuses}
            pagination={pagination}
            onPageChange={fetchStatuses}
          />
        )}
      </Card>
    </div>
  );
}
