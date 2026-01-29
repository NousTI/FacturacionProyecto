-- =========================================
-- MÓDULO: COMISIONES
-- TABLA: comisiones_logs
-- Descripción: Historial y trazabilidad de cambios de estado de comisiones
-- =========================================

CREATE TABLE IF NOT EXISTS sistema_facturacion.comisiones_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relación principal
    comision_id UUID NOT NULL
        REFERENCES sistema_facturacion.comisiones(id)
        ON DELETE CASCADE,

    -- Quién hizo el cambio
    -- NULL = sistema automático
    responsable_id UUID
        REFERENCES sistema_facturacion.users(id)
        ON DELETE SET NULL,

    rol_responsable TEXT NOT NULL
        CHECK (rol_responsable IN ('SUPERADMIN', 'SISTEMA')),

    -- Cambio de estado
    estado_anterior TEXT
        CHECK (estado_anterior IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'PAGADA')),

    estado_nuevo TEXT NOT NULL
        CHECK (estado_nuevo IN ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'PAGADA')),

    -- Snapshot del estado de la comisión
    datos_snapshot JSONB,

    -- Motivo del cambio
    observaciones TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- {
--   "comision": {
--     "id": "uuid-comision",
--     "estado": "APROBADA",
--     "estado_anterior": "PENDIENTE",
--     "estado_nuevo": "APROBADA"
--   },
--   "valores": {
--     "monto": 100.50,
--     "porcentaje_aplicado": 10.0,
--     "monto_calculado": 100.50
--   },
--   "fechas": {
--     "fecha_generacion": "2024-01-01T00:00:00Z",
--     "fecha_aprobacion": "2024-01-02T14:20:00Z",
--     "fecha_pago": null
--   },
--   "vendedor": {
--     "id": "uuid-vendedor",
--     "nombre": "Juan Perez",
--     "identificacion": "0102030405",
--     "porcentaje_comision": 10.0
--   },
--   "empresa": {
--     "id": "uuid-empresa",
--     "razon_social": "Empresa XYZ S.A.",
--     "ruc": "1790012345001"
--   },
--   "pago": {
--     "metodo_pago": null,
--     "referencia": null
--   },
--   "responsable": {
--     "id": "uuid-admin",
--     "nombre": "Maria Lopez",
--     "rol": "SUPERADMIN",
--     "origen": "MANUAL"
--   },
--   "observaciones": "Comisión aprobada tras validación del pago",
--   "created_at": "2024-01-02T14:20:00Z"
-- }
