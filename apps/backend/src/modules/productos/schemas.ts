import { z } from "zod";

export const productSeedItemSchema = z.object({
  sku: z.string().min(1),
  nombre: z.string().min(1),
  precio_venta: z.number().nonnegative(),
  costo_promedio: z.number().nonnegative().optional()
});

export const productsSeedSchema = z.array(productSeedItemSchema).min(1);

export const productosQuerySchema = z.object({
  search: z.string().optional(),
  sku: z.string().optional()
});

export type ProductSeedItemInput = z.infer<typeof productSeedItemSchema>;
