import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as compraPost } from "./compra/route";
import { POST as ajustePost } from "./ajuste/route";
import { forbiddenError } from "@/lib/http/errors";
import { authorizeRole, requireAuthContext } from "@/lib/auth/rbac";
import { createAjusteService, createCompraService } from "@/modules/movimientos/service";

vi.mock("@/lib/auth/rbac", () => ({
  requireAuthContext: vi.fn(),
  authorizeRole: vi.fn((context: { role: string }, allowedRoles: string[]) => {
    if (!allowedRoles.includes(context.role)) {
      throw forbiddenError();
    }
  })
}));

vi.mock("@/modules/movimientos/service", () => ({
  createCompraService: vi.fn(),
  createAjusteService: vi.fn()
}));

describe("RBAC on movimientos routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 for VENDEDORA on compra", async () => {
    vi.mocked(requireAuthContext).mockResolvedValue({
      userId: "user-vendedora",
      role: "VENDEDORA",
      bodegaAsignadaId: null
    } as never);

    const response = await compraPost(
      new Request("http://localhost:3001/api/movimientos/compra", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer token"
        },
        body: JSON.stringify({
          destino_bodega_id: "15f211e8-f95e-41b4-8f16-f622ce2e26f8",
          proveedor: "Proveedor",
          nro_documento: "FAC-123",
          items: [{ sku: "SKU-1", cantidad: 1, costo_unitario: 2 }]
        })
      })
    );

    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ error: { code: "FORBIDDEN" } });
    expect(authorizeRole).toHaveBeenCalled();
    expect(createCompraService).not.toHaveBeenCalled();
  });

  it("returns 403 for VENDEDORA on ajuste", async () => {
    vi.mocked(requireAuthContext).mockResolvedValue({
      userId: "user-vendedora",
      role: "VENDEDORA",
      bodegaAsignadaId: null
    } as never);

    const response = await ajustePost(
      new Request("http://localhost:3001/api/movimientos/ajuste", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer token"
        },
        body: JSON.stringify({
          bodega_id: "15f211e8-f95e-41b4-8f16-f622ce2e26f8",
          motivo: "Conteo físico",
          items: [{ sku: "SKU-1", delta: -1 }]
        })
      })
    );

    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({ error: { code: "FORBIDDEN" } });
    expect(authorizeRole).toHaveBeenCalled();
    expect(createAjusteService).not.toHaveBeenCalled();
  });

  it("preserves UTF-8 motive value in ajuste payload", async () => {
    vi.mocked(requireAuthContext).mockResolvedValue({
      userId: "user-admin",
      role: "ADMIN",
      bodegaAsignadaId: null
    } as never);

    vi.mocked(createAjusteService).mockResolvedValue({ id: "mov-utf8", detalles: [] } as never);

    const response = await ajustePost(
      new Request("http://localhost:3001/api/movimientos/ajuste", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer token"
        },
        body: JSON.stringify({
          bodega_id: "15f211e8-f95e-41b4-8f16-f622ce2e26f8",
          motivo: "Conteo físico",
          items: [{ sku: "SKU-1", delta: 1 }]
        })
      })
    );

    expect(response.status).toBe(201);
    expect(createAjusteService).toHaveBeenCalledWith(
      expect.objectContaining({ motivo: "Conteo físico" }),
      "user-admin"
    );
  });
});
