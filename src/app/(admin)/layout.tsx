"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
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

      if (!profile || !profile.is_active || profile.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setIsAuthorized(true);
    }

    checkAdminAccess();
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Verificando permissões...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <span className="font-semibold text-gray-800">Administração</span>
        <Link
          href="/users"
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Usuários
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-800 ml-auto"
        >
          Voltar ao Dashboard
        </Link>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
