"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Header } from "@/components/layout/Header";

interface MeUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Typography>Carregando...</Typography>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Typography>Não autenticado</Typography>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header role={user.role} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Card className="p-6">
          <Typography variant="h2" className="mb-4">
            Bem-vindo!
          </Typography>

          <div className="space-y-4">
            <div>
              <Typography variant="small" className="text-gray-600">
                E-mail
              </Typography>
              <Typography>{user.email}</Typography>
            </div>

            <div>
              <Typography variant="small" className="text-gray-600">
                ID do Usuário
              </Typography>
              <Typography className="break-all">{user.id}</Typography>
            </div>

            <div>
              <Typography variant="small" className="text-gray-600">
                Tipo de Perfil
              </Typography>
              <Typography className="capitalize">{user.role}</Typography>
            </div>

            <div>
              <Typography variant="small" className="text-gray-600">
                Status
              </Typography>
              <Typography>
                {user.isActive ? "Ativo" : "Inativo"}
              </Typography>
            </div>
          </div>

          {user.role === "admin" && (
            <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col gap-3 sm:flex-row sm:gap-6">
              <Link
                href="/users"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                aria-label="Ir para a tela de gestão de usuários"
              >
                Gerenciar Usuários
              </Link>
              <Link
                href="/statuses"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                aria-label="Ir para a tela de gestão de status de encomenda"
              >
                Gerenciar Status
              </Link>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
