"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api/client";
import { ShipmentFilters } from "@/components/shipments/ShipmentFilters";
import { ShipmentList } from "@/components/shipments/ShipmentList";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { ShipmentWithStatus } from "@/lib/types/shipment";
import Link from "next/link";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface FiltersState {
  search: string;
  status_id: string;
  carrier: string;
  arrival_date_from: string;
  arrival_date_to: string;
}

export default function EncomendasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<string | null>(null);
  const [shipments, setShipments] = useState<ShipmentWithStatus[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FiltersState>({
    search: searchParams.get("search") ?? "",
    status_id: searchParams.get("status_id") ?? "",
    carrier: searchParams.get("carrier") ?? "",
    arrival_date_from: searchParams.get("arrival_date_from") ?? "",
    arrival_date_to: searchParams.get("arrival_date_to") ?? "",
  });
  const [page, setPage] = useState(parseInt(searchParams.get("page") ?? "1", 10));

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) { router.push("/login"); return; }
      supabase
        .from("users")
        .select("role, is_active")
        .eq("id", authUser.id)
        .single()
        .then(({ data: profile }) => {
          if (!profile || !profile.is_active) { router.push("/login"); return; }
          setRole(profile.role as string);
        });
    });
  }, [router]);

  const loadShipments = useCallback(
    async (f: FiltersState, p: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(p));
        if (f.search) params.set("search", f.search);
        if (f.status_id) params.set("status_id", f.status_id);
        if (f.carrier) params.set("carrier", f.carrier);
        if (f.arrival_date_from) params.set("arrival_date_from", f.arrival_date_from);
        if (f.arrival_date_to) params.set("arrival_date_to", f.arrival_date_to);

        const res = await apiFetch(`/api/shipments?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setShipments(data.data.items as ShipmentWithStatus[]);
          setPagination(data.data.pagination as PaginationMeta);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (role) loadShipments(filters, page);
  }, [role, filters, page, loadShipments]);

  const handleFiltersChange = useCallback((newFilters: FiltersState) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  if (!role) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Typography variant="h2">Encomendas</Typography>
        {role === "admin" && (
          <Link
            href="/encomendas/nova"
            className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Cadastrar nova encomenda"
          >
            + Nova Encomenda
          </Link>
        )}
      </div>

      <Card className="p-4 mb-4">
        <ShipmentFilters
          initialFilters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </Card>

      <Card className="p-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500 text-sm">Carregando...</div>
        ) : (
          <ShipmentList
            shipments={shipments}
            pagination={pagination}
            onPageChange={setPage}
            hasActiveFilters={
              !!(filters.search || filters.status_id || filters.carrier || filters.arrival_date_from || filters.arrival_date_to)
            }
          />
        )}
      </Card>
    </div>
  );
}
