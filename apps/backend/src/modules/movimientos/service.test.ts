import { describe, expect, it, vi, beforeEach } from "vitest";

import { createAjusteService, createCompraService } from "./service";
import {
  fetchProductosBySkus,
  fetchStockByBodegaProducts,
  insertDetalles,
  insertMovimiento,
  updateProductoCostoPromedio,
  upsertStockQuantities
} from "./repository";

vi.mock("./repository", () => ({
  fetchProductosBySkus: vi.fn(),
  fetchStockByBodegaProducts: vi.fn(),
  getMovimientoById: vi.fn(),
  insertDetalles: vi.fn(),
  insertMovimiento: vi.fn(),
  listDetallesByMovimientoIds: vi.fn(),
  listMovimientos: vi.fn(),
  updateProductoCostoPromedio: vi.fn(),
  upsertStockQuantities: vi.fn()
}));

describe("movimientos service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates compra, inserts detail, updates stock and weighted average cost", async () => {
    vi.mocked(fetchProductosBySkus).mockResolvedValue({
      data: [{ id: "prod-1", sku: "SKU-1", costo_promedio: 2.5 }],
      error: null
    } as never);
    vi.mocked(insertMovimiento).mockResolvedValue({
      data: {
        id: "mov-1",
        tipo: "COMPRA_PROVEEDOR",
        estado: "COMPLETADO"
      },
      error: null
    } as never);
    vi.mocked(fetchStockByBodegaProducts).mockResolvedValue({
      data: [{ producto_id: "prod-1", cantidad: 10 }],
      error: null
    } as never);
    vi.mocked(insertDetalles).mockResolvedValue({
      data: [
        {
          id: "det-1",
          movimiento_id: "mov-1",
          producto_id: "prod-1",
          cantidad: 5,
          costo_unitario: 4,
          delta: null
        }
      ],
      error: null
    } as never);
    vi.mocked(upsertStockQuantities).mockResolvedValue({ error: null } as never);
    vi.mocked(updateProductoCostoPromedio).mockResolvedValue({ error: null } as never);

    const created = await createCompraService(
      {
        destino_bodega_id: "15f211e8-f95e-41b4-8f16-f622ce2e26f8",
        proveedor: "Proveedor A",
        nro_documento: "FAC-1",
        items: [{ sku: "SKU-1", cantidad: 5, costo_unitario: 4 }]
      },
      "user-1"
    );

    expect(insertDetalles).toHaveBeenCalledWith([
      {
        movimiento_id: "mov-1",
        producto_id: "prod-1",
        cantidad: 5,
        costo_unitario: 4,
        delta: null
      }
    ]);
    expect(upsertStockQuantities).toHaveBeenCalledWith([
      {
        bodega_id: "15f211e8-f95e-41b4-8f16-f622ce2e26f8",
        producto_id: "prod-1",
        cantidad: 15
      }
    ]);
    expect(updateProductoCostoPromedio).toHaveBeenCalledWith("prod-1", 3);
    expect(created.detalles).toHaveLength(1);
  });

  it("creates ajuste using signed delta and absolute cantidad", async () => {
    vi.mocked(fetchProductosBySkus).mockResolvedValue({
      data: [{ id: "prod-1", sku: "SKU-1", costo_promedio: 2.5 }],
      error: null
    } as never);
    vi.mocked(fetchStockByBodegaProducts).mockResolvedValue({
      data: [{ producto_id: "prod-1", cantidad: 10 }],
      error: null
    } as never);
    vi.mocked(insertMovimiento).mockResolvedValue({
      data: {
        id: "mov-2",
        tipo: "AJUSTE_AUDITORIA",
        estado: "COMPLETADO"
      },
      error: null
    } as never);
    vi.mocked(insertDetalles).mockResolvedValue({
      data: [
        {
          id: "det-2",
          movimiento_id: "mov-2",
          producto_id: "prod-1",
          cantidad: 3,
          costo_unitario: null,
          delta: -3
        }
      ],
      error: null
    } as never);
    vi.mocked(upsertStockQuantities).mockResolvedValue({ error: null } as never);

    const created = await createAjusteService(
      {
        bodega_id: "15f211e8-f95e-41b4-8f16-f622ce2e26f8",
        motivo: "Conteo físico",
        items: [{ sku: "SKU-1", delta: -3 }]
      },
      "user-1"
    );

    expect(insertDetalles).toHaveBeenCalledWith([
      {
        movimiento_id: "mov-2",
        producto_id: "prod-1",
        cantidad: 3,
        costo_unitario: null,
        delta: -3
      }
    ]);
    expect(upsertStockQuantities).toHaveBeenCalledWith([
      {
        bodega_id: "15f211e8-f95e-41b4-8f16-f622ce2e26f8",
        producto_id: "prod-1",
        cantidad: 7
      }
    ]);
    expect(created.detalles).toHaveLength(1);
  });

  it("returns conflict 409 when ajuste would leave negative stock", async () => {
    vi.mocked(fetchProductosBySkus).mockResolvedValue({
      data: [{ id: "prod-1", sku: "SKU-1", costo_promedio: 2.5 }],
      error: null
    } as never);
    vi.mocked(fetchStockByBodegaProducts).mockResolvedValue({
      data: [{ producto_id: "prod-1", cantidad: 2 }],
      error: null
    } as never);

    await expect(
      createAjusteService(
        {
          bodega_id: "15f211e8-f95e-41b4-8f16-f622ce2e26f8",
          motivo: "Conteo físico",
          items: [{ sku: "SKU-1", delta: -3 }]
        },
        "user-1"
      )
    ).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
      details: {
        sku: "SKU-1",
        current: 2,
        delta: -3
      }
    });

    expect(insertMovimiento).not.toHaveBeenCalled();
    expect(insertDetalles).not.toHaveBeenCalled();
    expect(upsertStockQuantities).not.toHaveBeenCalled();
  });
});
