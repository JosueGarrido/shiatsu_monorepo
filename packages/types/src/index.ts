export const MOVIMIENTO_TIPOS = [
  "COMPRA_PROVEEDOR",
  "VENTA_POS",
  "TRANSFERENCIA_ENVIADA",
  "TRANSFERENCIA_RECIBIDA",
  "AJUSTE_AUDITORIA"
] as const;

export type MovimientoTipo = (typeof MOVIMIENTO_TIPOS)[number];

export const PERFIL_ROLES = ["ADMIN", "BODEGUERO", "VENDEDORA", "GERENCIA"] as const;

export type PerfilRol = (typeof PERFIL_ROLES)[number];

export type CompraItemDTO = {
  sku: string;
  cantidad: number;
  costo_unitario: number;
};

export type AjusteItemDTO = {
  sku: string;
  delta: number;
};
