# SHIATSU — Mes 2: Backend Inventarios I (Spec-Driven)

## 1) Alcance contractual Mes 2

Entregables obligatorios:

- Endpoints CRUD básicos para stock por isla y bodega.
- Lógica de negocio para operaciones de inventario.
- Pruebas unitarias iniciales.
- QA interna (test + validaciones + checklist).

Este documento define el contrato funcional y técnico previo a implementación de endpoints.

## 2) Arquitectura monorepo (PNPM Workspaces)

Estructura:

- `apps/backend`: Next.js App Router; host de API `/api`.
- `apps/web`: reservado para frontend futuro (fuera de alcance Mes 2).
- `packages/db`: cliente Supabase y utilidades de acceso a datos.
- `packages/validators`: validación con Zod para requests/responses.
- `packages/types`: DTOs y enums de dominio inventario.
- `packages/config`: configuración compartida TS/ESLint/Prettier.

Reglas de dependencia:

- `apps/backend` puede importar `packages/*`.
- `apps/web` puede importar `packages/*`.
- `apps/backend` no puede depender de `apps/web`.
- `packages/*` no importan `apps/*`.

## 3) Reglas de negocio operativas (fuente de verdad)

### Ubicaciones

- Total 14 ubicaciones iniciales: 2 bodegas (Quito, Guayaquil) + 12 islas.
- Cada ubicación maneja stock independiente.
- No hay jerarquía estricta isla->bodega.
- Ubicaciones virtuales (merma/tránsito/devoluciones): preparadas para futuro.

### Stock y operación

- Stock negativo no permitido.
- Stock mínimo por producto y ubicación configurable (estructura mínima en Mes 2).
- Alertas de bajo stock: previstas para fase futura.
- Stock reservado/comprometido: no aplica en Mes 2, documentado para futuro.
- Falta de stock bloquea salidas (venta/transferencia/ajuste negativo).

### Roles y permisos (RBAC Mes 2)

- `VENDEDORA`: lectura de stock, bodegas y productos; sin compra/ajuste/transferencia.
- `BODEGUERO`: lectura stock + compra/ajuste/transferencia (según endpoint habilitado).
- `ADMIN`: acceso total.
- `GERENCIA`: acceso total.

Auditoría obligatoria:

- Todo movimiento registra `usuario_id` y `fecha`.

### Transferencias

- Descuento inmediato en origen.
- Transferencias parciales permitidas.
- Estado `EN_TRANSITO` opcional.
- Confirmación de recepción por administradora.
- Documento interno digital requerido.

Mes 2: endpoint de transferencia puede quedar no implementado con contrato OpenAPI y respuesta 501.

### Devoluciones

- Regresa al punto de compra por defecto.
- Si producto está en buen estado, suma stock automáticamente.
- Motivo obligatorio.
- Evidencia adjunta opcional.

Mes 2: flujo completo de devoluciones se deja documentado (sin endpoint dedicado en este corte).

### Ajustes de inventario

- Solo `ADMIN` y `GERENCIA` ajustan.
- Motivo obligatorio.
- Puede subir o bajar stock.
- Historial permanente (sin borrado lógico de movimientos auditados).

### Compras / ingresos

- Ingreso a bodega o isla.
- Proveedor y número de documento obligatorios.
- Recalcular costo promedio ponderado por producto:

$$
nuevo\_costo\_promedio =
\frac{(stock\_actual \cdot costo\_actual) + (compra\_cantidad \cdot costo\_compra\_unitario)}{stock\_actual + compra\_cantidad}
$$

## 4) Modelo de datos (Supabase Postgres)

Tablas mínimas Mes 2:

1. `bodegas`
2. `productos`
3. `stock`
4. `movimientos`
5. `detalle_movimiento`
6. `perfiles`

### Convenciones de migración SQL (versionadas)

- Carpeta objetivo: `apps/backend/supabase/migrations`.
- Naming: `YYYYMMDDHHMMSS_init_inventory.sql` y migraciones incrementales.
- Constraints críticas:
  - `stock.cantidad >= 0`
  - `productos.sku` único
  - `movimientos.usuario_id` y `movimientos.fecha` obligatorios

### Decisión para ajustes negativos

Se añade `detalle_movimiento.delta INTEGER NULL` para preservar signo en ajustes y facilitar auditoría. Para compras se mantiene `cantidad > 0` y `delta` en `NULL`.

## 5) Contrato de API (base `/api`)

### Health

- `GET /api/health` (sin auth)

### Auth y autorización

- JWT Supabase requerido para todo excepto `health`.

### Bodegas

- `GET /api/bodegas` (autenticado)
- `POST /api/bodegas` (`ADMIN`/`GERENCIA`)
- `PATCH /api/bodegas/{id}` (`ADMIN`/`GERENCIA`)

### Productos

- `POST /api/admin/seed/products` (`ADMIN`/`GERENCIA`) idempotente por `sku`.
- `GET /api/productos?search=&sku=` lectura autenticada.

Formato elegido para carga seed: JSON array.

### Stock

- `GET /api/stock?bodega_id=&sku=&producto_id=`
- `GET /api/stock/{bodega_id}`

Creación/actualización de stock solo vía compras y ajustes auditados.

### Movimientos

- `POST /api/movimientos/compra` (`ADMIN`/`GERENCIA`/`BODEGUERO`)
- `POST /api/movimientos/ajuste` (`ADMIN`/`GERENCIA`)
- `POST /api/movimientos/transferencia` (planned en Mes 2; puede responder 501)
- `GET /api/movimientos?tipo=&bodega_id=&desde=&hasta=`
- `GET /api/movimientos/{id}`

## 6) Envelope de error estándar

```json
{
  "error": {
    "code": "STRING_ENUM",
    "message": "human readable",
    "details": {}
  }
}
```

Códigos HTTP estándar:

- 400 validación
- 401 sin auth
- 403 sin rol
- 404 no existe
- 409 conflicto
- 500 inesperado

## 7) Plan de implementación por capas (Mes 2)

Capas backend (`apps/backend/src`):

- `lib/auth`: extracción de sesión y RBAC.
- `lib/http`: respuestas/error envelope.
- `modules/*/schemas`: validaciones request/response.
- `modules/*/repositories`: acceso DB.
- `modules/*/services`: reglas de negocio.
- `app/api/*`: handlers mínimos delegando en services.

## 8) Plan mínimo de pruebas (Vitest)

Unit tests en services con repos mock:

1. compra suma stock y crea movimiento + detalle.
2. compra recalcula costo_promedio ponderado.
3. ajuste con delta negativo falla si deja stock < 0.
4. invariante no stock negativo.
5. RBAC: vendedora recibe 403 en compra/ajuste.

## 9) Datos iniciales (Mes 2)

- Seed de productos (~140 SKU con precio de venta).
- Stock inicial de prueba por ubicación.
- Perfiles base:
  - Administradora: Milicen Pérez (`mperez@shiatsucorp.com`)
  - Gerencia: Sebastian Argoti (`sebastian@shiatsucorp.com`)

## 10) Spec Gaps (documentados)

1. No se definió source oficial del archivo de 140 productos; se asumirá JSON versionado en repo para seed inicial.
2. `BODEGUERO` tiene permiso de ajuste según sección de endpoints, pero reglas de negocio dicen ajuste solo admin/gerencia; prevalece regla de negocio y endpoint de ajuste quedará solo para `ADMIN/GERENCIA`.
3. Transferencia en Mes 2 queda como contrato `planned`; implementación funcional completa se difiere a Mes 3 si priorización no cambia.
4. Devoluciones se documentan pero no exponen endpoint dedicado en Mes 2.
5. No se especifica estrategia RLS en Supabase para este corte; Mes 2 usará control RBAC en capa API y dejará RLS para endurecimiento siguiente.

## 11) Checklist QA interno Mes 2

- [ ] OpenAPI publicada y consistente con handlers.
- [ ] Validaciones Zod en todas las entradas.
- [ ] RBAC aplicado por endpoint.
- [ ] Movimientos siempre con auditoría (`usuario_id`, `fecha`).
- [ ] Invariante de no stock negativo validado por DB y service.
- [ ] Test unitarios mínimos en verde.