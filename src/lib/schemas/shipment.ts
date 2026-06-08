import { z } from "zod";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const CreateShipmentSchema = z
  .object({
    code: z.string().min(1, "Código é obrigatório"),
    carrier: z.string().min(1, "Transportadora é obrigatória"),
    volume_count: z
      .number()
      .int("Quantidade de volumes deve ser inteiro")
      .min(1, "Quantidade de volumes deve ser >= 1"),
    arrival_date: z
      .string()
      .min(1, "Data de chegada é obrigatória")
      .regex(ISO_DATE_RE, "Data de chegada inválida"),
    pickup_date: z
      .string()
      .regex(ISO_DATE_RE, "Data de coleta inválida")
      .nullable()
      .optional(),
    destination: z.string().min(1, "Destino é obrigatório"),
    responsible: z.string().min(1, "Responsável é obrigatório"),
    status_id: z.string().uuid("Status inválido"),
    observations: z.string().nullable().optional(),
    collected_count: z
      .number()
      .int("Quantidade coletada deve ser inteiro")
      .min(0, "Quantidade coletada deve ser >= 0")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.pickup_date) return true;
      return data.pickup_date >= data.arrival_date;
    },
    { message: "Data de coleta deve ser >= data de chegada", path: ["pickup_date"] }
  );

export const UpdateShipmentSchema = z
  .object({
    code: z.string().min(1, "Código é obrigatório").optional(),
    carrier: z.string().min(1, "Transportadora é obrigatória").optional(),
    volume_count: z
      .number()
      .int()
      .min(1, "Quantidade de volumes deve ser >= 1")
      .optional(),
    arrival_date: z
      .string()
      .regex(ISO_DATE_RE, "Data de chegada inválida")
      .optional(),
    pickup_date: z
      .string()
      .regex(ISO_DATE_RE, "Data de coleta inválida")
      .nullable()
      .optional(),
    destination: z.string().min(1, "Destino é obrigatório").optional(),
    responsible: z.string().min(1, "Responsável é obrigatório").optional(),
    status_id: z.string().uuid("Status inválido").optional(),
    observations: z.string().nullable().optional(),
    collected_count: z
      .number()
      .int()
      .min(0, "Quantidade coletada deve ser >= 0")
      .nullable()
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.pickup_date || !data.arrival_date) return true;
      return data.pickup_date >= data.arrival_date;
    },
    { message: "Data de coleta deve ser >= data de chegada", path: ["pickup_date"] }
  );

export const UpdateShipmentStatusSchema = z.object({
  status_id: z.string().uuid("Status inválido"),
  observations: z.string().nullable().optional(),
  collected_count: z
    .number()
    .int()
    .min(0, "Quantidade coletada deve ser >= 0")
    .nullable()
    .optional(),
});

export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof UpdateShipmentSchema>;
export type UpdateShipmentStatusInput = z.infer<typeof UpdateShipmentStatusSchema>;
