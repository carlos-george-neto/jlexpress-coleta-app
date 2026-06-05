
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Typography } from "@/components/ui/Typography";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verificar se usuário está autenticado
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Se autenticado, redirecionar para dashboard
          router.push("/dashboard");
        } else {
          // Se não autenticado, redirecionar para login
          router.push("/login");
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        router.push("/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Typography>Carregando...</Typography>
      </div>
    );
  }

  return null;
}
