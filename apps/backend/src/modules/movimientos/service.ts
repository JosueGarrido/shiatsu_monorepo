import { conflictError, notFoundError } from "@/lib/http/errors";

import {
  fetchProductosBySkus,
  fetchStockByBodegaProducts,
  getMovimientoById,
  insertDetalles,
  insertMovimiento,
  listDetallesByMovimientoIds,
  listMovimientos,
  updateProductoCostoPromedio,
  upsertStockQuantities
} from "./repository";
import type { AjusteInput, CompraInput } from "./schemas";

function groupDetalles(
  movimientos: Array<{ id: string }>,
  detalles: Array<{
    id: string;
    movimiento_id: string;
    producto_id: string;
    cantidad: number;
    costo_unitario: number | null;
    delta: number | null;
  }>
) {
  const detailsByMovimiento = new Map<string, typeof detalles>();

  for (const detalle of detalles) {
    const current = detailsByMovimiento.get(detalle.movimiento_id) ?? [];
    current.push(detalle);
    detailsByMovimiento.set(detalle.movimiento_id, current);
  }

  return movimientos.map((movimiento) => ({
    ...movimiento,
    detalles: detailsByMovimiento.get(movimiento.id) ?? []
  }));
}

export async function createCompraService(input: CompraInput, userId: string) {
  const skus = input.items.map((item) => item.sku);
  const { data: products, error: productsError } = await fetchProductosBySkus(skus);

  if (productsError) {
    throw conflictError("Could not read products", { db: productsError.message });
  }

  const productBySku = new Map((products ?? []).map((product) => [product.sku, product]));

  for (const sku of skus) {
    if (!productBySku.has(sku)) {
      throw conflictError("Product does not exist", { sku });
    }
  }

  const movementResult = await insertMovimiento({
    tipo: "COMPRA_PROVEEDOR",
    estado: "COMPLETADO",
    destino_bodega_id: input.destino_bodega_id,
    usuario_id: userId,
    proveedor: input.proveedor,
    nro_documento: input.nro_documento
  });

  if (movementResult.error || !movementResult.data) {
    throw conflictError("Could not create movement", { db: movementResult.error?.message });
  }

  const movement = movementResult.data;
  const productIds = input.items.map((item) => productBySku.get(item.sku)!.id);
  const stockResult = await fetchStockByBodegaProducts(input.destino_bodega_id, productIds);

  if (stockResult.error) {
    throw conflictError("Could not read stock", { db: stockResult.error.message });
  }

  const stockByProductId = new Map((stockResult.data ?? []).map((row) => [row.producto_id, row]));

  const detallePayload = input.items.map((item) => {
    const product = productBySku.get(item.sku)!;
    return {
      movimiento_id: movement.id,
      producto_id: product.id,
      cantidad: item.cantidad,
      costo_unitario: item.costo_unitario,
      delta: null
    };
  });

  const detalleResult = await insertDetalles(detallePayload);

  if (detalleResult.error) {
    throw conflictError("Could not create movement details", { db: detalleResult.error.message });
  }

  const nextStockRows = input.items.map((item) => {
    const product = productBySku.get(item.sku)!;
    const existingQty = stockByProductId.get(product.id)?.cantidad ?? 0;
    return {
      bodega_id: input.destino_bodega_id,
      producto_id: product.id,
      cantidad: existingQty + item.cantidad
    };
  });

  const stockUpdateResult = await upsertStockQuantities(nextStockRows);

  if (stockUpdateResult.error) {
    throw conflictError("Could not update stock", { db: stockUpdateResult.error.message });
  }

  for (const item of input.items) {
    const product = productBySku.get(item.sku)!;
    const existingQty = stockByProductId.get(product.id)?.cantidad ?? 0;
    const existingCost = Number(product.costo_promedio ?? 0);
    const nextCost =
      (existingQty * existingCost + item.cantidad * item.costo_unitario) / (existingQty + item.cantidad);

    const updateResult = await updateProductoCostoPromedio(product.id, Number(nextCost.toFixed(4)));

    if (updateResult.error) {
      throw conflictError("Could not update average cost", {
        sku: item.sku,
        db: updateResult.error.message
      });
    }
  }

  return {
    ...movement,
    detalles: detalleResult.data ?? []
  };
}

export async function createAjusteService(input: AjusteInput, userId: string) {
  const skus = input.items.map((item) => item.sku);
  const { data: products, error: productsError } = await fetchProductosBySkus(skus);

  if (productsError) {
    throw conflictError("Could not read products", { db: productsError.message });
  }

  const productBySku = new Map((products ?? []).map((product) => [product.sku, product]));

  for (const sku of skus) {
    if (!productBySku.has(sku)) {
      throw conflictError("Product does not exist", { sku });
    }
  }

  const productIds = input.items.map((item) => productBySku.get(item.sku)!.id);
  const stockResult = await fetchStockByBodegaProducts(input.bodega_id, productIds);

  if (stockResult.error) {
    throw conflictError("Could not read stock", { db: stockResult.error.message });
  }

  const stockByProductId = new Map((stockResult.data ?? []).map((row) => [row.producto_id, row]));

  for (const item of input.items) {
    const product = productBySku.get(item.sku)!;
    const currentQty = stockByProductId.get(product.id)?.cantidad ?? 0;
    const nextQty = currentQty + item.delta;

    if (nextQty < 0) {
      throw conflictError("Insufficient stock for adjustment", {
        sku: item.sku,
        current: currentQty,
        delta: item.delta
      });
    }
  }

  const movementResult = await insertMovimiento({
    tipo: "AJUSTE_AUDITORIA",
    estado: "COMPLETADO",
    destino_bodega_id: input.bodega_id,
    usuario_id: userId,
    motivo: input.motivo
  });

  if (movementResult.error || !movementResult.data) {
    throw conflictError("Could not create movement", { db: movementResult.error?.message });
  }

  const movement = movementResult.data;

  const detallePayload = input.items.map((item) => {
    const product = productBySku.get(item.sku)!;
    return {
      movimiento_id: movement.id,
      producto_id: product.id,
      cantidad: Math.abs(item.delta),
      costo_unitario: null,
      delta: item.delta
    };
  });

  const detalleResult = await insertDetalles(detallePayload);

  if (detalleResult.error) {
    throw conflictError("Could not create movement details", { db: detalleResult.error.message });
  }

  const nextStockRows = input.items.map((item) => {
    const product = productBySku.get(item.sku)!;
    const currentQty = stockByProductId.get(product.id)?.cantidad ?? 0;
    return {
      bodega_id: input.bodega_id,
      producto_id: product.id,
      cantidad: currentQty + item.delta
    };
  });

  const stockUpdateResult = await upsertStockQuantities(nextStockRows);

  if (stockUpdateResult.error) {
    throw conflictError("Could not update stock", { db: stockUpdateResult.error.message });
  }

  return {
    ...movement,
    detalles: detalleResult.data ?? []
  };
}

export async function getMovimientosService(query: {
  tipo?: string;
  bodega_id?: string;
  desde?: string;
  hasta?: string;
}) {
  const { data: movimientos, error: movimientosError } = await listMovimientos(query);

  if (movimientosError) {
    throw conflictError("Could not fetch movements", { db: movimientosError.message });
  }

  const movimientoRows = movimientos ?? [];
  const detailsResult = await listDetallesByMovimientoIds(movimientoRows.map((row) => row.id));

  if (detailsResult.error) {
    throw conflictError("Could not fetch movement details", { db: detailsResult.error.message });
  }

  return groupDetalles(movimientoRows, detailsResult.data ?? []);
}

export async function getMovimientoByIdService(id: string) {
  const { data: movimiento, error: movimientoError } = await getMovimientoById(id);

  if (movimientoError) {
    throw conflictError("Could not fetch movement", { db: movimientoError.message });
  }

  if (!movimiento) {
    throw notFoundError("Movement not found");
  }

  const detailsResult = await listDetallesByMovimientoIds([id]);

  if (detailsResult.error) {
    throw conflictError("Could not fetch movement details", { db: detailsResult.error.message });
  }

  return {
    ...movimiento,
    detalles: detailsResult.data ?? []
  };
}
