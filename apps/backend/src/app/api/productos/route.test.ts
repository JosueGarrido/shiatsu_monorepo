import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "./route";
import { requireAuthContext } from "@/lib/auth/rbac";
import { getProductosService } from "@/modules/productos/service";

vi.mock("@/lib/auth/rbac", () => ({
  requireAuthContext: vi.fn(),
  authorizeRole: vi.fn()
}));

vi.mock("@/modules/productos/service", () => ({
  getProductosService: vi.fn()
}));

describe("GET /api/productos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Producto[] contract without wrappers", async () => {
    vi.mocked(requireAuthContext).mockResolvedValue({
      userId: "user-1",
      role: "ADMIN",
      bodegaAsignadaId: null
    } as never);

    const expected = [
      {
        id: "prod-1",
        sku: "SKU-1",
        nombre: "Producto 1",
        precio_venta: 100,
        costo_promedio: 50
      }
    ];

    vi.mocked(getProductosService).mockResolvedValue(expected as never);

    const response = await GET(
      new Request("http://localhost:3001/api/productos?search=prod", {
        headers: { authorization: "Bearer token" }
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toEqual(expected);
    expect(body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        sku: expect.any(String),
        nombre: expect.any(String),
        precio_venta: expect.any(Number),
        costo_promedio: expect.any(Number)
      })
    );
    expect(body).not.toHaveProperty("value");
    expect(body).not.toHaveProperty("Count");
  });

  it("returns [] when no products are found", async () => {
    vi.mocked(requireAuthContext).mockResolvedValue({
      userId: "user-1",
      role: "ADMIN",
      bodegaAsignadaId: null
    } as never);

    vi.mocked(getProductosService).mockResolvedValue([] as never);

    const response = await GET(
      new Request("http://localhost:3001/api/productos?sku=NOPE", {
        headers: { authorization: "Bearer token" }
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
    expect(Array.isArray(body)).toBe(true);
  });
});
