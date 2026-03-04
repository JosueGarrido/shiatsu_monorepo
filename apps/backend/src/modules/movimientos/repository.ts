import { supabaseServiceClient } from "@/lib/supabase";

type MovimientoInsert = {
  tipo: string;
  estado?: "COMPLETADO" | "EN_TRANSITO" | null;
  origen_bodega_id?: string | null;
  destino_bodega_id?: string | null;
  usuario_id: string;
  proveedor?: string | null;
  nro_documento?: string | null;
  motivo?: string | null;
  evidencia_url?: string | null;
};

type DetalleInsert = {
  movimiento_id: string;
  producto_id: string;
  cantidad: number;
  costo_unitario?: number | null;
  delta?: number | null;
};

export async function fetchProductosBySkus(skus: string[]) {
  return supabaseServiceClient
    .from("productos")
    .select("id, sku, costo_promedio")
    .in("sku", skus);
}

export async function fetchStockByBodegaProducts(bodegaId: string, productIds: string[]) {
  return supabaseServiceClient
    .from("stock")
    .select("bodega_id, producto_id, cantidad")
    .eq("bodega_id", bodegaId)
    .in("producto_id", productIds);
}

export async function insertMovimiento(data: MovimientoInsert) {
  return supabaseServiceClient
    .from("movimientos")
    .insert(data)
    .select(
      "id, tipo, estado, origen_bodega_id, destino_bodega_id, usuario_id, proveedor, nro_documento, motivo, evidencia_url, fecha"
    )
    .single();
}

export async function insertDetalles(detalles: DetalleInsert[]) {
  return supabaseServiceClient
    .from("detalle_movimiento")
    .insert(detalles)
    .select("id, movimiento_id, producto_id, cantidad, costo_unitario, delta");
}

export async function upsertStockQuantities(
  rows: Array<{ bodega_id: string; producto_id: string; cantidad: number }>
) {
  return supabaseServiceClient
    .from("stock")
    .upsert(rows, { onConflict: "bodega_id,producto_id" })
    .select("bodega_id, producto_id, cantidad");
}

export async function updateProductoCostoPromedio(productId: string, newCost: number) {
  return supabaseServiceClient
    .from("productos")
    .update({ costo_promedio: newCost })
    .eq("id", productId)
    .select("id")
    .single();
}

export async function listMovimientos(query: {
  tipo?: string;
  bodega_id?: string;
  desde?: string;
  hasta?: string;
}) {
  let builder = supabaseServiceClient
    .from("movimientos")
    .select(
      "id, tipo, estado, origen_bodega_id, destino_bodega_id, usuario_id, proveedor, nro_documento, motivo, evidencia_url, fecha"
    )
    .order("fecha", { ascending: false });

  if (query.tipo) {
    builder = builder.eq("tipo", query.tipo);
  }

  if (query.desde) {
    builder = builder.gte("fecha", query.desde);
  }

  if (query.hasta) {
    builder = builder.lte("fecha", query.hasta);
  }

  if (query.bodega_id) {
    builder = builder.or(
      `origen_bodega_id.eq.${query.bodega_id},destino_bodega_id.eq.${query.bodega_id}`
    );
  }

  return builder;
}

export async function getMovimientoById(id: string) {
  return supabaseServiceClient
    .from("movimientos")
    .select(
      "id, tipo, estado, origen_bodega_id, destino_bodega_id, usuario_id, proveedor, nro_documento, motivo, evidencia_url, fecha"
    )
    .eq("id", id)
    .maybeSingle();
}

export async function listDetallesByMovimientoIds(movimientoIds: string[]) {
  if (movimientoIds.length === 0) {
    return { data: [], error: null };
  }

  return supabaseServiceClient
    .from("detalle_movimiento")
    .select("id, movimiento_id, producto_id, cantidad, costo_unitario, delta")
    .in("movimiento_id", movimientoIds);
}
