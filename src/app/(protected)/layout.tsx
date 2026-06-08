"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role, is_active")
        .eq("id", authUser.id)
        .single();

      if (!profile || !profile.is_active) {
        router.push("/login");
        return;
      }

      setRole(profile.role as string);
    }

    checkAccess();
  }, [router]);

  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Verificando permissões...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header role={role} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
