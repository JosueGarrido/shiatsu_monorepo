BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.bodegas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('BODEGA', 'ISLA')),
  direccion TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  precio_venta NUMERIC(12,2) NOT NULL DEFAULT 0,
  costo_promedio NUMERIC(12,4) NOT NULL DEFAULT 0,
  categoria_id UUID NULL
);

CREATE TABLE IF NOT EXISTS public.perfiles (
  id UUID PRIMARY KEY,
  rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'BODEGUERO', 'VENDEDORA', 'GERENCIA')),
  bodega_asignada_id UUID NULL,
  CONSTRAINT perfiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT perfiles_bodega_asignada_id_fkey
    FOREIGN KEY (bodega_asignada_id)
    REFERENCES public.bodegas(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.stock (
  bodega_id UUID NOT NULL,
  producto_id UUID NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  stock_minimo INTEGER NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bodega_id, producto_id),
  CONSTRAINT stock_bodega_id_fkey
    FOREIGN KEY (bodega_id)
    REFERENCES public.bodegas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT stock_producto_id_fkey
    FOREIGN KEY (producto_id)
    REFERENCES public.productos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.movimientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (
    tipo IN (
      'COMPRA_PROVEEDOR',
      'VENTA_POS',
      'TRANSFERENCIA_ENVIADA',
      'TRANSFERENCIA_RECIBIDA',
      'AJUSTE_AUDITORIA'
    )
  ),
  estado TEXT NULL CHECK (estado IN ('COMPLETADO', 'EN_TRANSITO')),
  origen_bodega_id UUID NULL,
  destino_bodega_id UUID NULL,
  usuario_id UUID NOT NULL,
  proveedor TEXT NULL,
  nro_documento TEXT NULL,
  motivo TEXT NULL,
  evidencia_url TEXT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT movimientos_origen_bodega_id_fkey
    FOREIGN KEY (origen_bodega_id)
    REFERENCES public.bodegas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT movimientos_destino_bodega_id_fkey
    FOREIGN KEY (destino_bodega_id)
    REFERENCES public.bodegas(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT movimientos_usuario_id_fkey
    FOREIGN KEY (usuario_id)
    REFERENCES auth.users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS public.detalle_movimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movimiento_id UUID NOT NULL,
  producto_id UUID NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  costo_unitario NUMERIC(12,4) NULL,
  delta INTEGER NULL,
  CONSTRAINT detalle_movimiento_movimiento_id_fkey
    FOREIGN KEY (movimiento_id)
    REFERENCES public.movimientos(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT detalle_movimiento_producto_id_fkey
    FOREIGN KEY (producto_id)
    REFERENCES public.productos(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_productos_sku ON public.productos (sku);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON public.movimientos (fecha);
CREATE INDEX IF NOT EXISTS idx_stock_producto_id ON public.stock (producto_id);
CREATE INDEX IF NOT EXISTS idx_stock_bodega_id ON public.stock (bodega_id);
CREATE INDEX IF NOT EXISTS idx_detalle_movimiento_movimiento_id ON public.detalle_movimiento (movimiento_id);

COMMENT ON TABLE public.bodegas IS 'Mes 2: RLS diferido por alcance. Control de acceso en capa API.';
COMMENT ON TABLE public.productos IS 'Mes 2: RLS diferido por alcance. Control de acceso en capa API.';
COMMENT ON TABLE public.stock IS 'Mes 2: RLS diferido por alcance. Control de acceso en capa API.';
COMMENT ON TABLE public.movimientos IS 'Mes 2: RLS diferido por alcance. Control de acceso en capa API.';
COMMENT ON TABLE public.detalle_movimiento IS 'Mes 2: RLS diferido por alcance. Control de acceso en capa API.';
COMMENT ON TABLE public.perfiles IS 'Mes 2: RLS diferido por alcance. Control de acceso en capa API.';

COMMIT;