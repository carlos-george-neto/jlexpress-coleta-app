"use client";

import { UserRecord } from "@/lib/types/user";
import Link from "next/link";

type SortBy = "email" | "full_name" | "created_at" | "is_active";

interface Props {
  users: UserRecord[];
  sortBy: SortBy;
  sortOrder: "asc" | "desc";
  onSort: (column: SortBy) => void;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  collector: "Coletor",
  deliverer: "Entregador",
  user: "Usuário",
};

function SortIcon({ active, order }: { active: boolean; order: "asc" | "desc" }) {
  if (!active) return <span className="ml-1 text-gray-300">↕</span>;
  return <span className="ml-1">{order === "asc" ? "↑" : "↓"}</span>;
}

export function UserList({ users, sortBy, sortOrder, onSort }: Props) {
  const columns: { key: SortBy; label: string }[] = [
    { key: "email", label: "Email" },
    { key: "full_name", label: "Nome" },
    { key: "is_active", label: "Status" },
    { key: "created_at", label: "Criado em" },
  ];

  if (users.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        Nenhum usuário encontrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none hover:bg-gray-100"
                onClick={() => onSort(col.key)}
              >
                {col.label}
                <SortIcon active={sortBy === col.key} order={sortOrder} />
              </th>
            ))}
            <th className="px-4 py-3 text-left font-medium text-gray-600">Perfil</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="px-4 py-3 text-gray-800">{user.email}</td>
              <td className="px-4 py-3 text-gray-800">{user.full_name}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.is_active ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(user.created_at).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {roleLabels[user.role] ?? user.role}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/users/${user.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Editar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
