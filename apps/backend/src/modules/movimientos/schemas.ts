import { ajusteRequestSchema, compraRequestSchema } from "@shiatsu/validators";
import { z } from "zod";

export { ajusteRequestSchema, compraRequestSchema };

export const movimientosQuerySchema = z.object({
  tipo: z
    .enum([
      "COMPRA_PROVEEDOR",
      "VENTA_POS",
      "TRANSFERENCIA_ENVIADA",
      "TRANSFERENCIA_RECIBIDA",
      "AJUSTE_AUDITORIA"
    ])
    .optional(),
  bodega_id: z.string().uuid().optional(),
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional()
});

export const movimientoIdParamSchema = z.object({
  id: z.string().uuid()
});

export type CompraInput = z.infer<typeof compraRequestSchema>;
export type AjusteInput = z.infer<typeof ajusteRequestSchema>;
