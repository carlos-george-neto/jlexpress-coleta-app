"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <div className="space-y-6">
        <Card className="p-6 text-center">
          <Typography variant="h2" className="mb-2">
            Link Inválido
          </Typography>
          <Typography variant="small" className="mb-4">
            O link de redefinição de senha é inválido ou expirou.
          </Typography>
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:text-blue-700"
          >
            Solicitar novo link
          </Link>
        </Card>
      </div>
    );
  }

  const handleSuccess = () => {
    router.push("/login?reset=success");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Typography variant="h1">Redefinir Senha</Typography>
        <Typography variant="small">
          Insira sua nova senha abaixo
        </Typography>
      </div>

      <Card className="p-6">
        <ResetPasswordForm onSuccess={handleSuccess} />

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Typography>Carregando...</Typography>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
