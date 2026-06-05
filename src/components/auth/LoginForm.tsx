"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import Link from "next/link";

export function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const email = watch("email");
  const password = watch("password");

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        setServerError(result.error || "E-mail ou senha inválidos");
        setIsSubmitting(false);
        return;
      }

      // Persiste a sessão no localStorage do cliente antes de recarregar
      if (result.accessToken && result.refreshToken) {
        await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        });
      }

      // Full reload garante que o SDK Supabase inicializa a partir do localStorage,
      // evitando condição de corrida da navegação SPA com o estado interno do SDK.
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setServerError("Falha ao conectar ao servidor");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Erro do servidor */}
      {serverError && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {serverError}
        </div>
      )}

      {/* Campo de E-mail */}
      <FormField>
        <Input
          {...register("email")}
          type="email"
          placeholder="seu-email@exemplo.com"
          error={errors.email?.message}
          label="E-mail"
          disabled={isSubmitting}
        />
      </FormField>

      {/* Campo de Senha */}
      <FormField>
        <Input
          {...register("password")}
          type="password"
          placeholder="Sua senha"
          error={errors.password?.message}
          label="Senha"
          disabled={isSubmitting}
        />
      </FormField>

      {/* Botão de Entrar */}
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        isLoading={isSubmitting}
        className="w-full"
      >
        Entrar
      </Button>

      {/* Link de Recuperação de Senha */}
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Esqueceu sua senha?
        </Link>
      </div>
    </form>
  );
}
