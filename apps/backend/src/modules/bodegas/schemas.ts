import { z } from "zod";

export const bodegaCreateSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(["BODEGA", "ISLA"]),
  direccion: z.string().nullable().optional()
});

export const bodegaPatchSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    direccion: z.string().nullable().optional(),
    activo: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided");

export const bodegaIdParamSchema = z.object({
  id: z.string().uuid()
});

export type BodegaCreateInput = z.infer<typeof bodegaCreateSchema>;
export type BodegaPatchInput = z.infer<typeof bodegaPatchSchema>;
