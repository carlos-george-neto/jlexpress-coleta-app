"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusForm } from "@/components/admin/statuses/StatusForm";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { apiFetch } from "@/lib/api/client";
import Link from "next/link";

export default function NewStatusPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: {
    name: string;
    description: string;
    flow_order: number;
    requires_observation: boolean;
    is_exception: boolean;
    is_finalizer: boolean;
    indicative_color: string;
  }) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/shipment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          flow_order: data.flow_order,
          requires_observation: data.requires_observation,
          is_exception: data.is_exception,
          is_finalizer: data.is_finalizer,
          indicative_color: data.indicative_color || null,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.message || "Erro ao criar status");
        setIsLoading(false);
        return;
      }

      router.push("/shipment-status");
    } catch {
      setError("Falha ao conectar ao servidor");
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/shipment-status"
          className="text-sm text-blue-600 hover:text-blue-800"
          aria-label="Voltar para a listagem de status"
        >
          ← Voltar
        </Link>
        <Typography variant="h2">Novo Status</Typography>
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <StatusForm mode="create" onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
}
