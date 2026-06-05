import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(255),
  role: z.enum(["admin", "collector", "deliverer", "user"], {
    error: "Perfil inválido",
  }),
  password: z
    .string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número")
    .regex(/[!@#$%^&*]/, "Senha deve conter pelo menos um caractere especial"),
});

export const updateUserSchema = z
  .object({
    email: z.string().email("Email inválido").optional(),
    full_name: z
      .string()
      .min(3, "Nome deve ter no mínimo 3 caracteres")
      .max(255)
      .optional(),
    role: z
      .enum(["admin", "collector", "deliverer", "user"], {
        error: "Perfil inválido",
      })
      .optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Nenhum campo para atualizar",
  });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z
    .enum(["admin", "collector", "deliverer", "user"])
    .optional(),
  is_active: z
    .string()
    .transform((v) => v === "true")
    .pipe(z.boolean())
    .optional(),
  sort_by: z
    .enum(["email", "full_name", "created_at", "is_active"])
    .default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z
    .enum(["CREATE", "UPDATE", "DELETE", "PASSWORD_RESET", "ACTIVATE", "DEACTIVATE"])
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
