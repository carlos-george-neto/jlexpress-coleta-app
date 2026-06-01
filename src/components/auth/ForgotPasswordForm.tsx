"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailSchema, type EmailInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: EmailInput) => {
    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        setServerError(result.error || "Erro ao enviar e-mail de recuperação");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        "E-mail de recuperação enviado! Verifique sua caixa de entrada."
      );
      reset();

      if (onSuccess) {
        setTimeout(onSuccess, 3000);
      }
    } catch (error) {
      console.error("Erro ao solicitar recuperação:", error);
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

      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
          {successMessage}
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

      {/* Botão de Enviar */}
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        isLoading={isSubmitting}
        className="w-full"
      >
        Enviar Instruções
      </Button>
    </form>
  );
}
