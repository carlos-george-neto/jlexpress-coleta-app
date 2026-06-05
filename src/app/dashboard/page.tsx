"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth";
import { User } from "@/lib/types/auth";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Header } from "@/components/layout/Header";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();

        if (!currentUser) {
          router.push("/login");
          return;
        }

        setUser(currentUser);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [router]);

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
      <Header />

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
              <Typography className="capitalize">{user.profileType}</Typography>
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

          {user.profileType === "admin" && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                href="/users"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                aria-label="Ir para a tela de gestão de usuários"
              >
                Gerenciar Usuários
              </Link>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
