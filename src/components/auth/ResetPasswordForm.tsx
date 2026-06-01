"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Eye, EyeOff } from "lucide-react";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      // Aqui você faria a chamada para resetar a senha no servidor
      // Por enquanto, apenas simular sucesso
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) {
          onSuccess();
        }
      }, 1000);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      setServerError("Falha ao redefinir senha");
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

      {/* Campo de Nova Senha */}
      <FormField>
        <div className="relative">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Sua nova senha"
            error={errors.password?.message}
            label="Nova Senha"
            disabled={isSubmitting}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>
      </FormField>

      {/* Campo de Confirmação de Senha */}
      <FormField>
        <div className="relative">
          <Input
            {...register("confirmPassword")}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirme sua nova senha"
            error={errors.confirmPassword?.message}
            label="Confirmar Senha"
            disabled={isSubmitting}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>
      </FormField>

      {/* Botão de Confirmar */}
      <Button
        type="submit"
        disabled={!isValid || isSubmitting}
        isLoading={isSubmitting}
        className="w-full"
      >
        Confirmar Nova Senha
      </Button>
    </form>
  );
}
