import { supabaseServiceClient } from "@/lib/supabase";

import type { ProductSeedItemInput } from "./schemas";

export async function searchProductos(query: { search?: string; sku?: string }) {
  let builder = supabaseServiceClient
    .from("productos")
    .select("id, sku, nombre, precio_venta, costo_promedio")
    .order("nombre", { ascending: true });

  if (query.sku) {
    builder = builder.eq("sku", query.sku);
  }

  if (query.search) {
    builder = builder.ilike("nombre", `%${query.search}%`);
  }

  return builder;
}

export async function upsertProductosSeed(items: ProductSeedItemInput[]) {
  return supabaseServiceClient
    .from("productos")
    .upsert(
      items.map((item) => ({
        sku: item.sku,
        nombre: item.nombre,
        precio_venta: item.precio_venta,
        ...(item.costo_promedio !== undefined ? { costo_promedio: item.costo_promedio } : {})
      })),
      { onConflict: "sku" }
    )
    .select("id");
}
