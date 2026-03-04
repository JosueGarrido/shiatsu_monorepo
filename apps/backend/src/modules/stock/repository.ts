import { supabaseServiceClient } from "@/lib/supabase";

type StockQuery = {
  bodega_id?: string;
  sku?: string;
  producto_id?: string;
};

export async function queryStockRepository(query: StockQuery) {
  let builder = supabaseServiceClient.from("stock").select(`
      bodega_id,
      producto_id,
      cantidad,
      stock_minimo,
      bodegas:bodega_id(id, nombre, tipo),
      productos:producto_id(id, sku, nombre)
    `);

  if (query.bodega_id) {
    builder = builder.eq("bodega_id", query.bodega_id);
  }

  if (query.producto_id) {
    builder = builder.eq("producto_id", query.producto_id);
  }

  if (query.sku) {
    builder = builder.eq("productos.sku", query.sku);
  }

  return builder;
}

export async function getStockByBodegaRepository(bodegaId: string) {
  const bodegaQuery = supabaseServiceClient
    .from("bodegas")
    .select("id, nombre, tipo, direccion, activo")
    .eq("id", bodegaId)
    .maybeSingle();

  const stockQuery = supabaseServiceClient
    .from("stock")
    .select(`
      producto_id,
      cantidad,
      stock_minimo,
      productos:producto_id(sku, nombre)
    `)
    .eq("bodega_id", bodegaId);

  const [bodegaResult, stockResult] = await Promise.all([bodegaQuery, stockQuery]);
  return { bodegaResult, stockResult };
}
