-- =====================================================
-- TABLA: REPORTE_GENERADO
-- =====================================================
CREATE TABLE IF NOT EXISTS sistema_facturacion.reporte_generado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    tipo_reporte TEXT NOT NULL,

    nombre TEXT NOT NULL,

    parametros JSONB,

    formato VARCHAR(20),

    archivo_url TEXT,

    tamanio_bytes BIGINT,

    estado VARCHAR(50),

    fecha_generacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    fecha_expiracion TIMESTAMPTZ,

    descargas INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reporte_empresa ON sistema_facturacion.reporte_generado(empresa_id);
CREATE INDEX idx_reporte_usuario ON sistema_facturacion.reporte_generado(usuario_id);
CREATE INDEX idx_reporte_fecha_generacion ON sistema_facturacion.reporte_generado(fecha_generacion);