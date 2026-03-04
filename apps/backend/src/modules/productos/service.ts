import { conflictError } from "@/lib/http/errors";

import { searchProductos, upsertProductosSeed } from "./repository";
import type { ProductSeedItemInput } from "./schemas";

export async function getProductosService(query: { search?: string; sku?: string }) {
  const { data, error } = await searchProductos(query);

  if (error) {
    throw conflictError("Could not fetch products", { db: error.message });
  }

  return data ?? [];
}

export async function seedProductosService(items: ProductSeedItemInput[]) {
  const { data, error } = await upsertProductosSeed(items);

  if (error) {
    throw conflictError("Could not seed products", { db: error.message });
  }

  return { upserted: data?.length ?? 0 };
}
