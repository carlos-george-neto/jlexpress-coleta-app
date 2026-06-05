"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserForm } from "@/components/admin/users/UserForm";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import Link from "next/link";
export default function NewUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: { email: string; full_name: string; role: string; password: string }) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.message || "Erro ao criar usuário");
        setIsLoading(false);
        return;
      }

      router.push("/users");
    } catch {
      setError("Falha ao conectar ao servidor");
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/users" className="text-sm text-blue-600 hover:text-blue-800">
          ← Voltar
        </Link>
        <Typography variant="h2">Novo Usuário</Typography>
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <UserForm
          mode="create"
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}
