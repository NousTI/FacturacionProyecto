-- =====================================================
-- MIGRACIÓN: Cambiar tipo_movimiento y unidad_medida
-- de FK a VARCHAR con CHECK constraints
-- =====================================================

-- Este script migra la tabla 'inventario' de tener FKs a 'tipo_movimiento'
-- y 'unidad_medida' a tener columnas VARCHAR con validación CHECK.
-- Se preservan todos los registros existentes.

BEGIN TRANSACTION;

-- 1. CREAR TABLA TEMPORAL CON DATOS MIGRADOS
CREATE TEMPORARY TABLE temp_inventario AS
SELECT
    i.id,
    i.empresa_id,
    i.producto_id,
    tm.nombre AS tipo_movimiento,
    um.nombre AS unidad_medida,
    i.cantidad,
    i.fecha,
    i.estado,
    i.ubicacion_fisica,
    i.observaciones,
    i.created_at,
    i.updated_at
FROM sistema_facturacion.inventario i
LEFT JOIN sistema_facturacion.tipo_movimiento tm ON i.tipo_movimiento_id = tm.id
LEFT JOIN sistema_facturacion.unidad_medida um ON i.unidad_medida_id = um.id;

-- 2. ELIMINAR ÍNDICES EXISTENTES
DROP INDEX IF EXISTS sistema_facturacion.idx_inventario_empresa;
DROP INDEX IF EXISTS sistema_facturacion.idx_inventario_producto;
DROP INDEX IF EXISTS sistema_facturacion.idx_inventario_estado;
DROP INDEX IF EXISTS sistema_facturacion.idx_inventario_fecha;

-- 3. ELIMINAR LA TABLA ACTUAL (con los datos salvados en temp)
DROP TABLE sistema_facturacion.inventario;

-- 4. RECREAR LA TABLA CON ESTRUCTURA NUEVA
CREATE TABLE sistema_facturacion.inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    producto_id UUID NOT NULL
        REFERENCES sistema_facturacion.productos(id) ON DELETE RESTRICT,

    tipo_movimiento VARCHAR(20) NOT NULL
        CHECK (tipo_movimiento IN ('COMPRA', 'VENTA', 'DEVOLUCION')),

    unidad_medida VARCHAR(20) NOT NULL
        CHECK (unidad_medida IN ('UNIDAD', 'CAJA', 'BULTO', 'KILO', 'METRO', 'LITRO')),

    cantidad INT NOT NULL CHECK (cantidad >= 0),

    fecha DATE NOT NULL DEFAULT CURRENT_DATE,

    estado VARCHAR(15) NOT NULL
        CHECK (estado IN ('DISPONIBLE', 'RESERVADO', 'DAÑADO', 'EN_TRANSITO')),

    ubicacion_fisica VARCHAR(50),

    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INSERTAR DATOS MIGRADOS DE LA TABLA TEMPORAL
INSERT INTO sistema_facturacion.inventario (
    id, empresa_id, producto_id, tipo_movimiento, unidad_medida,
    cantidad, fecha, estado, ubicacion_fisica, observaciones,
    created_at, updated_at
)
SELECT
    id, empresa_id, producto_id, tipo_movimiento, unidad_medida,
    cantidad, fecha, estado, ubicacion_fisica, observaciones,
    created_at, updated_at
FROM temp_inventario;

-- 6. RECREAR ÍNDICES
CREATE INDEX idx_inventario_empresa ON sistema_facturacion.inventario(empresa_id);
CREATE INDEX idx_inventario_producto ON sistema_facturacion.inventario(producto_id);
CREATE INDEX idx_inventario_estado ON sistema_facturacion.inventario(estado);
CREATE INDEX idx_inventario_fecha ON sistema_facturacion.inventario(fecha);

-- 7. LIMPIAR TABLA TEMPORAL (se elimina automáticamente al final de la transacción)

COMMIT;

-- =====================================================
-- RESULTADO: Tabla 'inventario' migrada exitosamente
-- Los registros existentes se han preservado
-- =====================================================
