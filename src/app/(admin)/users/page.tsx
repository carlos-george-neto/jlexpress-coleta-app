"use client";

import { useState, useEffect, useCallback } from "react";
import { UserList } from "@/components/admin/users/UserList";
import { UserSearch } from "@/components/admin/users/UserSearch";
import { UserPagination } from "@/components/admin/users/UserPagination";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { UserRecord, PaginationMeta } from "@/lib/types/user";
import { apiFetch } from "@/lib/api/client";
import Link from "next/link";

type SortBy = "email" | "full_name" | "created_at" | "is_active";

interface ListResponse {
  success: boolean;
  data: {
    items: UserRecord[];
    pagination: PaginationMeta;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
          sort_by: sortBy,
          sort_order: sortOrder,
        });
        if (search) params.set("search", search);

        const res = await apiFetch(`/api/users?${params}`);
        const data: ListResponse = await res.json();

        if (!data.success) {
          setError("Erro ao carregar usuários");
          return;
        }

        setUsers(data.data.items);
        setPagination(data.data.pagination);
      } catch {
        setError("Falha ao conectar ao servidor");
      } finally {
        setIsLoading(false);
      }
    },
    [search, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  function handleSort(column: SortBy) {
    if (column === sortBy) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  }

  function handleSearch(value: string) {
    setSearch(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography variant="h2">Usuários</Typography>
        <Link href="/users/new">
          <Button>+ Novo Usuário</Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <UserSearch value={search} onChange={handleSearch} />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Carregando...</div>
        ) : (
          <>
            <UserList
              users={users}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
            <UserPagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={fetchUsers}
            />
          </>
        )}
      </Card>
    </div>
  );
}
