import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const compraItemSchema = z.object({
  sku: z.string().min(1),
  cantidad: z.number().int().positive(),
  costo_unitario: z.number().positive()
});

export const compraRequestSchema = z.object({
  destino_bodega_id: uuidSchema,
  proveedor: z.string().min(1),
  nro_documento: z.string().min(1),
  items: z.array(compraItemSchema).min(1)
});

export const ajusteItemSchema = z.object({
  sku: z.string().min(1),
  delta: z.number().int().refine((value) => value !== 0, "delta must be non-zero")
});

export const ajusteRequestSchema = z.object({
  bodega_id: uuidSchema,
  motivo: z.string().min(1),
  items: z.array(ajusteItemSchema).min(1)
});
