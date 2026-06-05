"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserRecord } from "@/lib/types/user";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  collector: "Coletor",
  deliverer: "Entregador",
  user: "Usuário",
};

const roleEnum = z.enum(["admin", "collector", "deliverer", "user"], {
  error: "Perfil inválido",
});

const createSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(255),
  role: roleEnum,
  password: z
    .string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Deve ter letra maiúscula")
    .regex(/[0-9]/, "Deve ter número")
    .regex(/[!@#$%^&*]/, "Deve ter caractere especial"),
});

const editSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(255),
  role: roleEnum,
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

interface CreateProps {
  mode: "create";
  onSubmit: (data: { email: string; full_name: string; role: string; password: string }) => Promise<void>;
  isLoading?: boolean;
}

interface EditProps {
  mode: "edit";
  user: UserRecord;
  onSubmit: (data: { email?: string; full_name?: string; role?: string }) => Promise<void>;
  isLoading?: boolean;
}

type Props = CreateProps | EditProps;

function EmailField({
  register,
  error,
  userId,
  disabled,
}: {
  register: ReturnType<typeof useForm>["register"];
  error?: string;
  userId?: string;
  disabled?: boolean;
}) {
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const { watch } = useForm();
  const watchedEmail = watch("email");

  const checkEmail = useCallback(
    async (email: string) => {
      if (!email || !email.includes("@")) {
        setEmailStatus("idle");
        return;
      }
      setEmailStatus("checking");
      try {
        const params = new URLSearchParams({ email });
        if (userId) params.set("exclude_user_id", userId);
        const res = await fetch(`/api/users/validate-email?${params}`);
        const data = await res.json();
        setEmailStatus(data.available ? "available" : "taken");
      } catch {
        setEmailStatus("idle");
      }
    },
    [userId]
  );

  useEffect(() => {
    if (!watchedEmail) return;
    const timer = setTimeout(() => checkEmail(watchedEmail as string), 300);
    return () => clearTimeout(timer);
  }, [watchedEmail, checkEmail]);

  return (
    <Input
      {...register("email")}
      type="email"
      label="Email"
      placeholder="usuario@exemplo.com"
      error={error || (emailStatus === "taken" ? "Email já cadastrado" : undefined)}
      success={emailStatus === "available"}
      disabled={disabled}
    />
  );
}

function CreateForm({ onSubmit, isLoading = false }: Omit<CreateProps, "mode">) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    mode: "onChange",
  });

  const watchedEmail = watch("email");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const checkEmail = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) { setEmailStatus("idle"); return; }
    setEmailStatus("checking");
    try {
      const res = await fetch(`/api/users/validate-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setEmailStatus(data.available ? "available" : "taken");
    } catch { setEmailStatus("idle"); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (watchedEmail) checkEmail(watchedEmail); }, 300);
    return () => clearTimeout(timer);
  }, [watchedEmail, checkEmail]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        {...register("email")}
        type="email"
        label="Email"
        placeholder="usuario@exemplo.com"
        error={errors.email?.message || (emailStatus === "taken" ? "Email já cadastrado" : undefined)}
        success={emailStatus === "available"}
        disabled={isLoading}
      />
      <Input
        {...register("full_name")}
        type="text"
        label="Nome completo"
        placeholder="João da Silva"
        error={errors.full_name?.message}
        disabled={isLoading}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Perfil <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          {...register("role")}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione um perfil</option>
          {Object.entries(roleLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {errors.role && <span className="text-xs text-red-500">{errors.role.message}</span>}
      </div>
      <Input
        {...register("password")}
        type="password"
        label="Senha"
        placeholder="Mínimo 8 caracteres"
        error={errors.password?.message}
        disabled={isLoading}
      />
      <Button
        type="submit"
        disabled={!isValid || isLoading || emailStatus === "taken" || emailStatus === "checking"}
        isLoading={isLoading}
        className="w-full mt-2"
      >
        Criar usuário
      </Button>
    </form>
  );
}

function EditForm({ user, onSubmit, isLoading = false }: Omit<EditProps, "mode">) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    mode: "onChange",
    defaultValues: { email: user.email, full_name: user.full_name, role: user.role },
  });

  const watchedEmail = watch("email");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const checkEmail = useCallback(async (email: string) => {
    if (!email || !email.includes("@")) { setEmailStatus("idle"); return; }
    setEmailStatus("checking");
    try {
      const res = await fetch(`/api/users/validate-email?email=${encodeURIComponent(email)}&exclude_user_id=${user.id}`);
      const data = await res.json();
      setEmailStatus(data.available ? "available" : "taken");
    } catch { setEmailStatus("idle"); }
  }, [user.id]);

  useEffect(() => {
    const timer = setTimeout(() => { if (watchedEmail) checkEmail(watchedEmail); }, 300);
    return () => clearTimeout(timer);
  }, [watchedEmail, checkEmail]);

  async function handleEdit(data: EditValues) {
    await onSubmit({ email: data.email, full_name: data.full_name, role: data.role });
  }

  return (
    <form onSubmit={handleSubmit(handleEdit)} className="flex flex-col gap-5">
      <Input
        {...register("email")}
        type="email"
        label="Email"
        placeholder="usuario@exemplo.com"
        error={errors.email?.message || (emailStatus === "taken" ? "Email já cadastrado" : undefined)}
        success={emailStatus === "available"}
        disabled={isLoading}
      />
      <Input
        {...register("full_name")}
        type="text"
        label="Nome completo"
        placeholder="João da Silva"
        error={errors.full_name?.message}
        disabled={isLoading}
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Perfil <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          {...register("role")}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione um perfil</option>
          {Object.entries(roleLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {errors.role && <span className="text-xs text-red-500">{errors.role.message}</span>}
      </div>
      <Button
        type="submit"
        disabled={!isValid || isLoading || emailStatus === "taken" || emailStatus === "checking"}
        isLoading={isLoading}
        className="w-full mt-2"
      >
        Salvar alterações
      </Button>
    </form>
  );
}

export function UserForm(props: Props) {
  if (props.mode === "create") {
    return <CreateForm onSubmit={props.onSubmit} isLoading={props.isLoading} />;
  }
  return <EditForm user={props.user} onSubmit={props.onSubmit} isLoading={props.isLoading} />;
}
