import { conflictError, notFoundError } from "@/lib/http/errors";

import { getStockByBodegaRepository, queryStockRepository } from "./repository";

function unwrapProducto(
  value: { sku?: string; nombre?: string } | { sku?: string; nombre?: string }[] | null
) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function queryStockService(query: {
  bodega_id?: string;
  sku?: string;
  producto_id?: string;
}) {
  const { data, error } = await queryStockRepository(query);

  if (error) {
    throw conflictError("Could not fetch stock", { db: error.message });
  }

  return (data ?? []).map((row) => {
    const producto = unwrapProducto(
      row.productos as { sku?: string; nombre?: string } | { sku?: string; nombre?: string }[] | null
    );

    return {
      bodega_id: row.bodega_id,
      producto_id: row.producto_id,
      sku: producto?.sku ?? "",
      nombre: producto?.nombre ?? "",
      cantidad: row.cantidad,
      stock_minimo: row.stock_minimo
    };
  });
}

export async function getStockByBodegaService(bodegaId: string) {
  const { bodegaResult, stockResult } = await getStockByBodegaRepository(bodegaId);

  if (bodegaResult.error) {
    throw conflictError("Could not fetch bodega", { db: bodegaResult.error.message });
  }

  if (!bodegaResult.data) {
    throw notFoundError("Bodega not found");
  }

  if (stockResult.error) {
    throw conflictError("Could not fetch stock", { db: stockResult.error.message });
  }

  return {
    bodega: bodegaResult.data,
    productos: (stockResult.data ?? []).map((row) => {
      const producto = unwrapProducto(
        row.productos as
          | { sku?: string; nombre?: string }
          | { sku?: string; nombre?: string }[]
          | null
      );

      return {
        producto_id: row.producto_id,
        sku: producto?.sku ?? "",
        nombre: producto?.nombre ?? "",
        cantidad: row.cantidad,
        stock_minimo: row.stock_minimo
      };
    })
  };
}
