import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

type HttpMethod = "GET" | "POST";

type ApiResult<T = unknown> = {
  ok: boolean;
  status: number;
  body: T;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function callApi<T>(
  baseUrl: string,
  token: string,
  method: HttpMethod,
  path: string,
  payload?: unknown
): Promise<ApiResult<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(payload ? { "content-type": "application/json; charset=utf-8" } : {})
    },
    ...(payload ? { body: JSON.stringify(payload) } : {})
  });

  const raw = await response.text();
  let parsed: unknown = raw;

  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = raw;
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsed as T
  };
}

function fail(step: string, result: ApiResult) {
  console.error(`SMOKE FAILED at: ${step}`);
  console.error(`status=${result.status}`);
  console.error(`body=${JSON.stringify(result.body, null, 2)}`);
  process.exit(1);
}

async function main() {
  const supabaseUrl = required("SUPABASE_URL");
  const supabaseAnonKey = required("SUPABASE_ANON_KEY");
  const testEmail = required("TEST_EMAIL");
  const testPassword = required("TEST_PASSWORD");
  const baseUrl = process.env.LOCAL_BASE_URL ?? "http://localhost:3001";

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const auth = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (auth.error || !auth.data.session?.access_token) {
    console.error("SMOKE FAILED at: auth.signInWithPassword");
    console.error(auth.error?.message ?? "No access token returned");
    process.exit(1);
  }

  const token = auth.data.session.access_token;
  const stamp = Date.now();

  const health = await callApi(baseUrl, token, "GET", "/api/health");
  if (!health.ok || health.status !== 200) {
    fail("GET /api/health", health);
  }

  const bodegasList = await callApi<Array<{ id: string; nombre: string }>>(baseUrl, token, "GET", "/api/bodegas");
  if (!bodegasList.ok || bodegasList.status !== 200) {
    fail("GET /api/bodegas", bodegasList);
  }

  const bodegaCreate = await callApi<{ id: string; nombre: string }>(baseUrl, token, "POST", "/api/bodegas", {
    nombre: `SMOKE-BODEGA-${stamp}`,
    ubicacion: "SMOKE",
    activa: true
  });
  if (!bodegaCreate.ok || bodegaCreate.status !== 201 || !bodegaCreate.body?.id) {
    fail("POST /api/bodegas", bodegaCreate);
  }

  const bodegaId = bodegaCreate.body.id;
  const sku = `SMOKE-SKU-${stamp}`;

  const seed = await callApi<{ upserted: number }>(baseUrl, token, "POST", "/api/admin/seed/products", [
    {
      sku,
      nombre: `SMOKE PRODUCT ${stamp}`,
      precio_venta: 100,
      costo_promedio: 2.5
    }
  ]);
  if (!seed.ok || seed.status !== 200) {
    fail("POST /api/admin/seed/products", seed);
  }

  const compra = await callApi(baseUrl, token, "POST", "/api/movimientos/compra", {
    destino_bodega_id: bodegaId,
    proveedor: `SMOKE-PROV-${stamp}`,
    nro_documento: `SMOKE-DOC-${stamp}`,
    items: [{ sku, cantidad: 10, costo_unitario: 3.5 }]
  });
  if (!compra.ok || compra.status !== 201) {
    fail("POST /api/movimientos/compra", compra);
  }

  const ajuste = await callApi(baseUrl, token, "POST", "/api/movimientos/ajuste", {
    bodega_id: bodegaId,
    motivo: "Conteo físico",
    items: [{ sku, delta: -2 }]
  });
  if (!ajuste.ok || ajuste.status !== 201) {
    fail("POST /api/movimientos/ajuste", ajuste);
  }

  const stock = await callApi<{
    bodega: { id: string; nombre: string };
    productos: Array<{ sku: string; cantidad: number }>;
  }>(baseUrl, token, "GET", `/api/stock/${bodegaId}`);

  if (!stock.ok || stock.status !== 200) {
    fail("GET /api/stock/{bodega_id}", stock);
  }

  const stockItem = stock.body.productos.find((item) => item.sku === sku);
  if (!stockItem || stockItem.cantidad !== 8) {
    console.error("SMOKE FAILED at: stock assertion");
    console.error(`Expected sku=${sku} cantidad=8`);
    console.error(`Got: ${JSON.stringify(stock.body, null, 2)}`);
    process.exit(1);
  }

  console.log("SMOKE CLOUD OK");
  console.log(`bodega_id=${bodegaId}`);
  console.log(`sku=${sku}`);
  console.log("final_stock=8");
}

main().catch((error) => {
  console.error("SMOKE FAILED (unhandled)");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
