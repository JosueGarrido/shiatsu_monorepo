import { z } from "zod";

export const stockQuerySchema = z.object({
  bodega_id: z.string().uuid().optional(),
  sku: z.string().optional(),
  producto_id: z.string().uuid().optional()
});

export const stockBodegaIdSchema = z.object({
  bodega_id: z.string().uuid()
});
