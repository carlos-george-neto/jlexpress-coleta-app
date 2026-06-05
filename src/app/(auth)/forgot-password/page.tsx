"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/login");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Typography variant="h1">Recuperar Senha</Typography>
        <Typography variant="small">
          Insira seu e-mail para receber instruções de recuperação
        </Typography>
      </div>

      <Card className="p-6">
        <ForgotPasswordForm onSuccess={handleSuccess} />

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Voltar para login
          </Link>
        </div>
      </Card>
    </div>
  );
}
