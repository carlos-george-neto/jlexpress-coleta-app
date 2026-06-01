"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (!result.success) {
        console.error("Erro ao fazer logout:", result.error);
        setIsLoading(false);
        return;
      }

      // Redirecionar para login
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      isLoading={isLoading}
      variant="secondary"
      className="flex items-center gap-2"
    >
      <LogOut size={18} />
      Sair
    </Button>
  );
}
