# shiatsu_monorepo

## Monorepo

- `apps/backend`: Next.js backend (Mes 2)
- `apps/web`: placeholder frontend
- `packages/*`: shared db/types/validators/config

## Backend (Mes 2) - Supabase Cloud

Este proyecto usa Supabase Cloud para auth y base de datos. No requiere `supabase start` ni `supabase db reset` para el flujo normal.

### Run

- `pnpm --filter @shiatsu/backend dev`
- `pnpm --filter @shiatsu/backend test`
- `pnpm --filter @shiatsu/backend smoke` (opcional, requiere env vars)

## Variables de entorno para smoke cloud

Configura en `apps/backend/.env.local`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `TEST_EMAIL`
- `TEST_PASSWORD`
- `LOCAL_BASE_URL` (opcional, default `http://localhost:3001`)

## Manual verification recipe

### A) Contrato GET /api/productos (debe devolver array `Producto[]`)

Usa salida raw (evita wrappers visuales de PowerShell sobre arrays de 1 elemento):

```powershell
curl.exe -s -H "Authorization: Bearer $env:JWT" "http://localhost:3001/api/productos?sku=SKU-001"
```

La respuesta debe iniciar con `[` y no con `{ value: ..., Count: ... }`.

### B) UTF-8 en ajuste (`motivo = "Conteo físico"`)

1) Crea archivo UTF-8 `apps/backend/scripts/ajuste-utf8.json` con contenido:

```json
{
	"bodega_id": "REEMPLAZAR_BODEGA_ID",
	"motivo": "Conteo físico",
	"items": [
		{ "sku": "SKU-001", "delta": 1 }
	]
}
```

2) Enviar preservando bytes UTF-8:

```powershell
curl.exe -s -X POST "http://localhost:3001/api/movimientos/ajuste" ^
	-H "Authorization: Bearer $env:JWT" ^
	-H "Content-Type: application/json; charset=utf-8" ^
	--data-binary "@apps/backend/scripts/ajuste-utf8.json"
```

3) Verifica luego el movimiento y confirma que `motivo` se mantiene como `Conteo físico`.

## Smoke test cloud (opcional)

Script: `apps/backend/scripts/smoke-cloud.ts`

Flujo validado:

1. Login con `signInWithPassword`.
2. `GET /api/health`.
3. `GET /api/bodegas`.
4. `POST /api/bodegas` (nombre único con timestamp).
5. `POST /api/admin/seed/products` (SKU único con timestamp).
6. `POST /api/movimientos/compra`.
7. `POST /api/movimientos/ajuste` con `motivo: "Conteo físico"`.
8. `GET /api/stock/{bodega_id}` y assert de cantidad final esperada.

Comando:

```bash
pnpm --filter @shiatsu/backend smoke
```

Si falta alguna variable o falla un paso, el script imprime el primer error con `status` + `body`.