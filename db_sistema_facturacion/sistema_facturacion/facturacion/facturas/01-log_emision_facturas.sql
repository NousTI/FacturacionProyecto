-- ===================================================================
-- TABLA: log_emision_facturas (REFACTORIZADA)
-- ===================================================================
-- Auditoría de "Grano Fino": Rastra cada segundo y detalle del envío al SRI
CREATE TABLE IF NOT EXISTS sistema_facturacion.log_emision_facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones principales
    factura_id UUID NOT NULL 
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,
    facturacion_programada_id UUID 
        REFERENCES sistema_facturacion.facturacion_programada(id) ON DELETE SET NULL,

    -- 1. CONTEXTO DEL INTENTO (¿Cómo y dónde?)
    ambiente SMALLINT NOT NULL 
        CHECK (ambiente IN (1, 2)) 
        COMMENT '1=PRUEBAS, 2=PRODUCCION',
    tipo_intento VARCHAR(30) NOT NULL DEFAULT 'INICIAL'
        CHECK (tipo_intento IN ('INICIAL', 'REINTENTO', 'CONTINGENCIA', 'RECTIFICACION', 'CONSULTA')),
    intento_numero INT NOT NULL DEFAULT 1 
        CHECK (intento_numero >= 0),
    clave_acceso VARCHAR(49) 
        COMMENT 'Clave de acceso única enviada en este intento',

    -- 2. RESULTADO DEL SISTEMA (¿Qué pasó?)
    estado VARCHAR(30) NOT NULL
        CHECK (estado IN ('EN_PROCESO', 'EXITOSO', 'ERROR_VALIDACION', 'ERROR_CONECTIVIDAD', 'ERROR_SISTEMA'))
        COMMENT 'Estado interno simplificado para el sistema',
    sri_estado_raw VARCHAR(30) 
        COMMENT 'Estado crudo devuelto por el WS (ej: DEVUELTA, NO AUTORIZADO)',

    -- 3. DETALLE TÉCNICO Y PERFORMANCE (Telemetría)
    fase_falla VARCHAR(30) 
        CHECK (fase_falla IN ('RECEPCION', 'AUTORIZACION', 'FIRMA', 'SISTEMA', 'AUTORIZACION_CONSULTA'))
        COMMENT 'En qué etapa exacta falló el proceso',
    duracion_ms INT 
        COMMENT 'Tiempo total de respuesta del SRI en milisegundos',
    
    -- 4. MENSAJES ROBUSTOS (Estructura JSONB)
    mensajes JSONB NOT NULL DEFAULT '[]'::jsonb
        COMMENT 'Lista completa de errores y advertencias [{codigo, mensaje, tipo, info_adicional}]',

    -- 5. TRAZABILIDAD DEL CLIENTE (Seguridad e IP)
    client_info JSONB NOT NULL DEFAULT '{}'::jsonb
        COMMENT 'Datos del emisor: {ip, user_agent, locale, version_app}',

    -- 6. NOTIFICACIÓN AL CLIENTE (¿Se entregó la factura?)
    notificado_cliente BOOLEAN DEFAULT FALSE,
    mensaje_notificacion TEXT 
        COMMENT 'Resultado del envío por email (ej: "Enviado con éxito" o error de SMTP)',

    -- 7. AUDITORÍA FÍSICA (Documentos)
    xml_enviado TEXT COMMENT 'Respaldo del XML firmado enviado',
    xml_respuesta TEXT COMMENT 'Respaldo del XML recibido del SRI',

    -- 8. METADATA DE CONTROL
    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT
        COMMENT 'Usuario que presionó el botón emitir',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observaciones TEXT
);

-- Índices para reportes y diagnóstico rápido
CREATE INDEX idx_log_factura_id ON sistema_facturacion.log_emision_facturas(factura_id);
CREATE INDEX idx_log_estado_time ON sistema_facturacion.log_emision_facturas(estado, timestamp);
CREATE INDEX idx_log_clave_acceso ON sistema_facturacion.log_emision_facturas(clave_acceso);

COMMENT ON TABLE sistema_facturacion.log_emision_facturas IS 
'Tabla de control total de emisiones. Soporta múltiples errores por JSONB, telemetría de red y auditoría de cliente (IP).';