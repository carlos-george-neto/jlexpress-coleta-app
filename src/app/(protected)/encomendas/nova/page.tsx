"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api/client";
import { ShipmentForm } from "@/components/shipments/ShipmentForm";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import Link from "next/link";

export default function NovaEncomendaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleChecked, setRoleChecked] = useState(false);

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
          if (profile.role !== "admin") { router.push("/encomendas"); return; }
          setRoleChecked(true);
        });
    });
  }, [router]);

  if (!roleChecked) return null;

  async function handleSubmit(data: {
    code: string;
    carrier: string;
    volume_count: number;
    arrival_date: string;
    pickup_date: string;
    destination: string;
    responsible: string;
    status_id: string;
    observations: string;
    collected_count: string;
  }) {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: data.code,
          carrier: data.carrier,
          volume_count: data.volume_count,
          arrival_date: data.arrival_date,
          pickup_date: data.pickup_date || null,
          destination: data.destination,
          responsible: data.responsible,
          status_id: data.status_id,
          observations: data.observations || null,
          collected_count: data.collected_count !== "" ? parseInt(data.collected_count, 10) : null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/encomendas");
      } else {
        setError(json.details?.message ?? json.message ?? "Erro ao cadastrar encomenda");
      }
    } catch {
      setError("Erro ao cadastrar encomenda. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/encomendas"
          className="text-sm text-blue-600 hover:text-blue-800"
          aria-label="Voltar para listagem de encomendas"
        >
          ← Voltar para Encomendas
        </Link>
        <Typography variant="h2" className="mt-2">
          Nova Encomenda
        </Typography>
      </div>

      <Card className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        <ShipmentForm mode="create" onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
}
