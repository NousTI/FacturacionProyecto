
-- ===================================================================
-- TABLA: facturas
-- ===================================================================
-- Tabla Principal - eventos de facturación
-- Mantiene los datos transaccionales, el resto va en logs específicos
-- Estados: BORRADOR (creada pero no emitida), EMITIDA (enviada al SRI), ANULADA (cancelada)
CREATE TABLE IF NOT EXISTS sistema_facturacion.facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Referencias a datos maestros
    empresa_id UUID NOT NULL
        REFERENCES sistema_facturacion.empresas(id) ON DELETE CASCADE,

    establecimiento_id UUID NOT NULL
        REFERENCES sistema_facturacion.establecimientos(id) ON DELETE RESTRICT,

    punto_emision_id UUID NOT NULL
        REFERENCES sistema_facturacion.puntos_emision(id) ON DELETE RESTRICT,

    cliente_id UUID NOT NULL
        REFERENCES sistema_facturacion.clientes(id) ON DELETE RESTRICT,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT,

    facturacion_programada_id UUID
        REFERENCES sistema_facturacion.facturacion_programada(id) ON DELETE SET NULL,

    -- =============================================
    -- SNAPSHOTS JSON: Auditoría - datos al momento de emisión
    -- Cada referencia se copia como JSON para preservar estado original
    -- =============================================
    snapshot_empresa JSONB NOT NULL 
        COMMENT 'Snapshot empresa: {id, numero_ruc, razon_social, nombre_comercial, email, telefono, direccion, ciudad, provincia}',
    
    snapshot_cliente JSONB NOT NULL
        COMMENT 'Snapshot cliente: {id, tipo_identificacion, numero_identificacion, nombres, apellidos, razon_social, email, telefono, direccion, ciudad, provincia}',
    
    snapshot_establecimiento JSONB NOT NULL
        COMMENT 'Snapshot establecimiento: {id, codigo, nombre, direccion}',
    
    snapshot_punto_emision JSONB NOT NULL
        COMMENT 'Snapshot punto_emision: {id, codigo, nombre, establecimiento_id, secuencial_actual}',
    
    snapshot_usuario JSONB NOT NULL
        COMMENT 'Snapshot usuario: {id, nombre, apellido, email, rol}',

    -- =============================================
    -- INFORMACIÓN SRI (Ecuador)
    -- =============================================
    numero_factura TEXT NOT NULL UNIQUE 
        CHECK (numero_factura ~ '^\d{3}-\d{3}-\d{9}$')
        COMMENT 'Formato: NNN-NNN-NNNNNNNNN',
    
    secuencial_punto_emision INT NOT NULL
        COMMENT 'Número secuencial para este punto de emisión',
    
    clave_acceso VARCHAR(49) UNIQUE
        COMMENT 'Clave de acceso SRI (49 dígitos) - se genera al emitir',
    
    numero_autorizacion VARCHAR(49)
        COMMENT 'Número de autorización SRI - se obtiene tras validación exitosa',
    
    -- Tipo de documento SRI: 01=Factura, 04=Nota Crédito, 05=Nota Débito
    tipo_documento VARCHAR(2) DEFAULT '01' 
        CHECK (tipo_documento IN ('01', '04', '05'))
        COMMENT '01=Factura, 04=Nota Crédito, 05=Nota Débito',
    
    -- Ambiente: 1=Prueba, 2=Producción
    ambiente INT DEFAULT 1 
        CHECK (ambiente IN (1, 2))
        COMMENT '1=Prueba (test), 2=Producción',
    
    -- Tipo de emisión: 1=Normal, 2=Contingencia
    tipo_emision INT DEFAULT 1 
        CHECK (tipo_emision IN (1, 2))
        COMMENT '1=Normal, 2=Contingencia',

    -- =============================================
    -- FECHAS
    -- =============================================
    fecha_emision DATE NOT NULL
        COMMENT 'Fecha en que se crea/emite la factura',
    
    fecha_vencimiento DATE
        COMMENT 'Fecha de vencimiento del pago',
    
    fecha_autorizacion TIMESTAMPTZ
        COMMENT 'Fecha/hora cuando SRI autoriza la factura',

    -- =============================================
    -- MONTOS CON VALIDACIONES
    -- =============================================
    subtotal_sin_iva NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (subtotal_sin_iva >= 0)
        COMMENT 'Subtotal sin IVA',
    
    subtotal_con_iva NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (subtotal_con_iva >= 0)
        COMMENT 'Subtotal con IVA',
    
    iva NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (iva >= 0)
        COMMENT 'Impuesto al Valor Agregado',
    
    descuento NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (descuento >= 0)
        COMMENT 'Descuento aplicado',
    
    propina NUMERIC(12,2) NOT NULL DEFAULT 0 
        CHECK (propina >= 0)
        COMMENT 'Propina/Gratificación',
    
    retencion_iva NUMERIC(12,2) DEFAULT 0 
        CHECK (retencion_iva >= 0)
        COMMENT 'Retención de IVA',
    
    retencion_renta NUMERIC(12,2) DEFAULT 0 
        CHECK (retencion_renta >= 0)
        COMMENT 'Retención de Renta',
    
    total NUMERIC(12,2) NOT NULL 
        CHECK (total = ROUND(subtotal_con_iva + propina - descuento - retencion_iva - retencion_renta, 2))
        COMMENT 'Total = subtotal + propina - descuento - retenciones',

    -- =============================================
    -- ESTADOS: Ciclo de vida de la factura
    -- =============================================
    -- BORRADOR: Creada pero aún no emitida al SRI
    -- EMITIDA: Enviada y autorizada por el SRI
    -- ANULADA: Cancelada (ver log_emision_facturas para detalles)
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' 
        CHECK (estado IN ('BORRADOR', 'EMITIDA', 'ANULADA'))
        COMMENT 'BORRADOR=creada, EMITIDA=autorizada SRI, ANULADA=cancelada',
    
    -- Estado de pago (independiente del estado de emisión)
    -- PENDIENTE: No pagada
    -- PAGADO: Pagada en su totalidad
    -- PARCIAL: Pagada parcialmente
    -- VENCIDO: Pasó fecha vencimiento sin pagar
    estado_pago VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE' 
        CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL', 'VENCIDO'))
        COMMENT 'PENDIENTE, PAGADO, PARCIAL, VENCIDO',
    
    -- Origen de la factura
    origen VARCHAR(20) 
        CHECK (origen IN ('MANUAL', 'IMPORTADO', 'API', 'FACTURACION_PROGRAMADA'))
        COMMENT 'Cómo se creó: MANUAL, IMPORTADO, API, o FACTURACION_PROGRAMADA',

    -- =============================================
    -- AUDITORÍA
    -- =============================================
    observaciones TEXT
        COMMENT 'Notas y observaciones generales',
    
    razon_anulacion TEXT
        COMMENT 'Motivo si fue anulada',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de creación',
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de última modificación'
);

-- ===================================================================
-- TABLA: log_emision_facturas
-- ===================================================================
-- Auditoría: Rastrean todo lo referente a la emisión al SRI
-- Una factura puede tener múltiples logs si se reintenta
CREATE TABLE IF NOT EXISTS sistema_facturacion.log_emision_facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factura_id UUID NOT NULL
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,

    -- Tipo de intento: INICIAL, REINTENTO, CONTINGENCIA, RECTIFICACION
    tipo_intento VARCHAR(20) NOT NULL DEFAULT 'INICIAL'
        CHECK (tipo_intento IN ('INICIAL', 'REINTENTO', 'CONTINGENCIA', 'RECTIFICACION'))
        COMMENT 'Tipo de intento de emisión',
    
    -- Estado del intento: EN_PROCESO, EXITOSO, ERROR_VALIDACION, ERROR_CONECTIVIDAD, ERROR_OTRO
    estado VARCHAR(30) NOT NULL
        CHECK (estado IN ('EN_PROCESO', 'EXITOSO', 'ERROR_VALIDACION', 'ERROR_CONECTIVIDAD', 'ERROR_OTRO'))
        COMMENT 'En qué estado resultó el intento',
    
    -- Número secuencial de intento
    intento_numero INT NOT NULL DEFAULT 1 CHECK (intento_numero > 0)
        COMMENT 'Número de intento (1 = primer intento)',
    
    -- Códigos y mensajes de error
    codigo_error VARCHAR(50)
        COMMENT 'Código de error del SRI si aplica',
    
    mensaje_error TEXT
        COMMENT 'Mensaje de error detallado',
    
    -- URLs para auditoría
    xml_enviado TEXT
        COMMENT 'XML que se envió al SRI',
    
    xml_respuesta TEXT
        COMMENT 'XML de respuesta del SRI',
    
    -- Auditoría
    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT
        COMMENT 'Usuario que realizó el intento',
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Fecha/hora del intento',
    
    observaciones TEXT
        COMMENT 'Notas adicionales del intento'
);

CREATE INDEX IF NOT EXISTS idx_log_emision_factura_id 
    ON sistema_facturacion.log_emision_facturas(factura_id);

CREATE INDEX IF NOT EXISTS idx_log_emision_estado 
    ON sistema_facturacion.log_emision_facturas(estado);

CREATE INDEX IF NOT EXISTS idx_log_emision_timestamp 
    ON sistema_facturacion.log_emision_facturas(timestamp);

COMENT ON TABLE sistema_facturacion.log_emision_facturas IS
'Auditoría de intentos de emisión al SRI. Una factura puede tener múltiples registros si se reintenta.';

-- ===================================================================
-- TABLA: autorizacion_sri
-- ===================================================================
-- Auditoría: Datos de la autorización final del SRI
CREATE TABLE IF NOT EXISTS sistema_facturacion.autorizacion_sri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factura_id UUID NOT NULL
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,
    
    CONSTRAINT uq_autorizacion_sri_factura UNIQUE (factura_id)
        COMMENT 'Una sola autorización por factura',

    numero_autorizacion VARCHAR(49) NOT NULL
        COMMENT 'Número de autorización del SRI',
    
    fecha_autorizacion TIMESTAMPTZ NOT NULL
        COMMENT 'Fecha/hora de autorización',
    
    -- Estado de la autorización
    estado VARCHAR(30) NOT NULL
        CHECK (estado IN ('AUTORIZADO', 'NO_AUTORIZADO', 'DEVUELTO', 'CANCELADO'))
        COMMENT 'Estado de la autorización',
    
    mensajes JSONB
        COMMENT 'Mensajes/advertencias del SRI en formato JSON',
    
    xml_enviado TEXT
        COMMENT 'XML original enviado',
    
    xml_respuesta TEXT
        COMMENT 'XML de respuesta del SRI',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de creación del registro',
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de actualización'
);

CREATE INDEX IF NOT EXISTS idx_autorizacion_sri_factura_id 
    ON sistema_facturacion.autorizacion_sri(factura_id);

CREATE INDEX IF NOT EXISTS idx_autorizacion_sri_numero 
    ON sistema_facturacion.autorizacion_sri(numero_autorizacion);

COMMENT ON TABLE sistema_facturacion.autorizacion_sri IS
'Datos de la autorización final del SRI. Una sola autorización por factura.';

-- ===================================================================
-- TABLA: log_pago_facturas
-- ===================================================================
-- Auditoría: Rastrean todo lo referente al pago
-- Una factura puede tener múltiples pagos si se paga en cuotas
CREATE TABLE IF NOT EXISTS sistema_facturacion.log_pago_facturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    factura_id UUID NOT NULL
        REFERENCES sistema_facturacion.facturas(id) ON DELETE CASCADE,

    usuario_id UUID NOT NULL
        REFERENCES sistema_facturacion.usuarios(id) ON DELETE RESTRICT
        COMMENT 'Usuario que registró el pago',
    
    -- Pago
    monto NUMERIC(12,2) NOT NULL CHECK (monto > 0)
        COMMENT 'Monto pagado',
    
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE
        COMMENT 'Fecha del pago',
    
    -- Método de pago
    metodo_pago VARCHAR(30) NOT NULL
        CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'CHEQUE', 'DEPOSITO', 'OTRO'))
        COMMENT 'Método de pago: EFECTIVO, TRANSFERENCIA, TARJETA, etc.',
    
    numero_referencia VARCHAR(100)
        COMMENT 'Referencia del banco/método (ej: número de cheque, referencia de transferencia)',
    
    comprobante_url TEXT
        COMMENT 'URL del comprobante de pago (recibo, etc.)',
    
    -- Auditoría
    observaciones TEXT
        COMMENT 'Notas sobre el pago',
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
        COMMENT 'Timestamp de registro del pago'
);

CREATE INDEX IF NOT EXISTS idx_log_pago_factura_id 
    ON sistema_facturacion.log_pago_facturas(factura_id);

CREATE INDEX IF NOT EXISTS idx_log_pago_fecha 
    ON sistema_facturacion.log_pago_facturas(fecha_pago);

CREATE INDEX IF NOT EXISTS idx_log_pago_usuario 
    ON sistema_facturacion.log_pago_facturas(usuario_id);

COMMENT ON TABLE sistema_facturacion.log_pago_facturas IS
'Auditoría de pagos. Una factura puede tener múltiples pagos (cuotas, abonos, etc.)';

-- ===================================================================
-- ÍNDICES EN TABLA FACTURAS
-- ===================================================================
CREATE INDEX IF NOT EXISTS idx_facturas_empresa_id 
    ON sistema_facturacion.facturas(empresa_id)
    COMMENT 'Búsqueda rápida de facturas por empresa';

CREATE INDEX IF NOT EXISTS idx_facturas_establecimiento_id 
    ON sistema_facturacion.facturas(establecimiento_id)
    COMMENT 'Búsqueda rápida de facturas por establecimiento';

CREATE INDEX IF NOT EXISTS idx_facturas_punto_emision_id 
    ON sistema_facturacion.facturas(punto_emision_id)
    COMMENT 'Búsqueda rápida de facturas por punto de emisión';

CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id 
    ON sistema_facturacion.facturas(cliente_id)
    COMMENT 'Búsqueda rápida de facturas por cliente';

CREATE INDEX IF NOT EXISTS idx_facturas_usuario_id 
    ON sistema_facturacion.facturas(usuario_id)
    COMMENT 'Búsqueda rápida de facturas por usuario';

CREATE INDEX IF NOT EXISTS idx_facturas_estado 
    ON sistema_facturacion.facturas(estado)
    COMMENT 'Búsqueda rápida por estado de emisión';

CREATE INDEX IF NOT EXISTS idx_facturas_estado_pago 
    ON sistema_facturacion.facturas(estado_pago)
    COMMENT 'Búsqueda rápida por estado de pago';

CREATE INDEX IF NOT EXISTS idx_facturas_fecha_emision 
    ON sistema_facturacion.facturas(fecha_emision)
    COMMENT 'Búsqueda rápida por fecha';

CREATE INDEX IF NOT EXISTS idx_facturas_numero_factura 
    ON sistema_facturacion.facturas(numero_factura)
    COMMENT 'Búsqueda rápida por número de factura';

CREATE INDEX IF NOT EXISTS idx_facturas_clave_acceso 
    ON sistema_facturacion.facturas(clave_acceso)
    COMMENT 'Búsqueda rápida por clave de acceso';

CREATE INDEX IF NOT EXISTS idx_facturas_numero_autorizacion 
    ON sistema_facturacion.facturas(numero_autorizacion)
    COMMENT 'Búsqueda rápida por número de autorización';

-- Índices GIN para búsquedas en snapshots JSON
CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_empresa 
    ON sistema_facturacion.facturas USING GIN(snapshot_empresa)
    COMMENT 'Búsqueda en datos JSON del snapshot de empresa';

CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_cliente 
    ON sistema_facturacion.facturas USING GIN(snapshot_cliente)
    COMMENT 'Búsqueda en datos JSON del snapshot de cliente';

CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_establecimiento 
    ON sistema_facturacion.facturas USING GIN(snapshot_establecimiento)
    COMMENT 'Búsqueda en datos JSON del snapshot de establecimiento';

CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_punto_emision 
    ON sistema_facturacion.facturas USING GIN(snapshot_punto_emision)
    COMMENT 'Búsqueda en datos JSON del snapshot de punto_emision';

CREATE INDEX IF NOT EXISTS idx_facturas_snapshot_usuario 
    ON sistema_facturacion.facturas USING GIN(snapshot_usuario)
    COMMENT 'Búsqueda en datos JSON del snapshot de usuario';

-- ===================================================================
-- DOCUMENTACIÓN: Cómo usar estas tablas
-- ===================================================================

/*

FLUJO DE FACTURACIÓN NORMALIZADO
================================

La factura pasa por varios estados independientes:

1. ESTADO DE EMISIÓN (tabla facturas.estado):
   - BORRADOR: Factura creada pero NO enviada al SRI
   - EMITIDA: Factura autorizada por el SRI  
   - ANULADA: Factura cancelada

2. ESTADO DE PAGO (tabla facturas.estado_pago):
   - PENDIENTE: Sin pagar
   - PAGADO: Pagada en su totalidad
   - PARCIAL: Pagada pero sin llegar al total
   - VENCIDO: Pasó la fecha de vencimiento sin pagar


CICLO DE VIDA DE UNA FACTURA
=============================

PASO 1: CREAR FACTURA (ESTADO = BORRADOR)
------------------------------------------
INSERT INTO sistema_facturacion.facturas (
    empresa_id, establecimiento_id, punto_emision_id, cliente_id, usuario_id,
    numero_factura, secuencial_punto_emision,
    tipo_documento, ambiente, tipo_emision,
    fecha_emision, fecha_vencimiento,
    subtotal_sin_iva, subtotal_con_iva, iva, descuento, propina,
    retencion_iva, retencion_renta, total,
    estado, estado_pago, origen,
    snapshot_datos,
    observaciones
) VALUES (
    -- IDs
    '...empresa...', '...establecimiento...', '...punto...', '...cliente...', '...usuario...',
    -- Datos factura
    '001-001-000000001', 1,
    '01', 2, 1,
    CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
    -- Montos
    100.00, 112.00, 12.00, 0, 0, 0, 0, 112.00,
    -- Estados
    'BORRADOR', 'PENDIENTE', 'MANUAL',
    -- Snapshot (JSON con datos de referencias actuales)
    snapshot_empresa: {"id": "uuid", "numero_ruc": "...", "razon_social": "..."},
    snapshot_cliente: {"id": "uuid", "tipo_identificacion": "RUC", "numero_identificacion": "..."},
    snapshot_establecimiento: {"id": "uuid", "codigo": "...", "nombre": "..."},
    snapshot_punto_emision: {"id": "uuid", "codigo": "...", "secuencial_actual": 1},
    snapshot_usuario: {"id": "uuid", "nombre": "...", "email": "..."},
    'Factura manual'
);

PASO 2: EMITIR FACTURA AL SRI (ESTADO = EMITIDA)
-------------------------------------------------
Cuando se emite al SRI:

a) Registrar intento de emisión:
   INSERT INTO sistema_facturacion.log_emision_facturas (
       factura_id, tipo_intento, estado, intento_numero,
       codigo_error, mensaje_error,
       xml_enviado, xml_respuesta,
       usuario_id, observaciones
   ) VALUES (
       '...factura_id...', 'INICIAL', 'EN_PROCESO', 1,
       NULL, NULL,
       '...xml enviado...', NULL,
       '...usuario...', 'Intento inicial'
   );

b) Si el SRI autoriza exitosamente:
   -- Actualizar factura
   UPDATE sistema_facturacion.facturas
   SET estado = 'EMITIDA',
       clave_acceso = '...generada...',
       numero_autorizacion = '...del sri...',
       fecha_autorizacion = NOW(),
       updated_at = NOW()
   WHERE id = '...factura_id...';
   
   -- Registrar autorización
   INSERT INTO sistema_facturacion.autorizacion_sri (
       factura_id, numero_autorizacion, fecha_autorizacion,
       estado, mensajes, xml_enviado, xml_respuesta
   ) VALUES (
       '...factura_id...', '...numero...', NOW(),
       'AUTORIZADO', '...',
       '...xml...', '...respuesta...'
   );
   
   -- Actualizar log como exitoso
   UPDATE sistema_facturacion.log_emision_facturas
   SET estado = 'EXITOSO',
       xml_respuesta = '...respuesta...',
       mensaje_error = NULL
   WHERE factura_id = '...factura_id...'
   ORDER BY timestamp DESC LIMIT 1;

c) Si hay error:
   -- Actualizar log con error
   UPDATE sistema_facturacion.log_emision_facturas
   SET estado = 'ERROR_VALIDACION' -- o ERROR_CONECTIVIDAD, ERROR_OTRO
       codigo_error = '...codigo...',
       mensaje_error = '...mensaje...',
       xml_respuesta = '...respuesta...'
   WHERE factura_id = '...factura_id...'
   ORDER BY timestamp DESC LIMIT 1;
   
   -- NO actualizar factura.estado (sigue en BORRADOR)
   -- Usuarios pueden ver el error en log_emision_facturas y reintentar

PASO 3: REGISTRAR PAGO
---------------------
Cuando se recibe un pago:

INSERT INTO sistema_facturacion.log_pago_facturas (
    factura_id, usuario_id,
    monto, fecha_pago,
    metodo_pago, numero_referencia, comprobante_url,
    observaciones
) VALUES (
    '...factura_id...', '...usuario...',
    50.00, CURRENT_DATE,
    'TRANSFERENCIA', 'TRF-12345', 'https://...',
    'Pago parcial'
);

-- Backend debe luego actualizar estado_pago de la factura:
-- Si suma de log_pago_facturas >= total → 'PAGADO'
-- Si suma parcial → 'PARCIAL'
-- Si está vencido y no pagado → 'VENCIDO'

PASO 4: ANULAR FACTURA
---------------------
UPDATE sistema_facturacion.facturas
SET estado = 'ANULADA',
    razon_anulacion = 'Motivo de anulación',
    updated_at = NOW()
WHERE id = '...factura_id...';

-- El log de emisión no se toca, quedan los registros de intentos


QUERIES ÚTILES PARA AUDITORÍA
=============================

-- Listar facturas por estado
SELECT * FROM sistema_facturacion.facturas
WHERE estado = 'EMITIDA' AND estado_pago = 'VENCIDO'
ORDER BY fecha_emision DESC;

-- Ver historial de emisión de una factura
SELECT * FROM sistema_facturacion.log_emision_facturas
WHERE factura_id = '...'
ORDER BY timestamp DESC;

-- Ver intentos fallidos en las últimas 24 horas
SELECT * FROM sistema_facturacion.log_emision_facturas
WHERE estado LIKE 'ERROR%'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Ver historial de pagos
SELECT * FROM sistema_facturacion.log_pago_facturas
WHERE factura_id = '...'
ORDER BY fecha_pago DESC;

-- Calcular lo pagado en una factura
SELECT 
    f.id,
    f.numero_factura,
    f.total,
    COALESCE(SUM(p.monto), 0) as monto_pagado,
    f.total - COALESCE(SUM(p.monto), 0) as saldo_pendiente,
    f.estado_pago
FROM sistema_facturacion.facturas f
LEFT JOIN sistema_facturacion.log_pago_facturas p ON f.id = p.factura_id
WHERE f.id = '...'
GROUP BY f.id, f.numero_factura, f.total, f.estado_pago;

-- Facturas con datos modificados después de emisión
-- (Comparar snapshots vs datos actuales en clientes, etc)
SELECT 
    f.id,
    f.numero_factura,
    f.snapshot_cliente::jsonb ->> 'numero_identificacion' as snapshot_cedula_cliente,
    (SELECT numero_identificacion FROM sistema_facturacion.clientes WHERE id = f.cliente_id) as cedula_cliente_actual,
    f.snapshot_empresa::jsonb ->> 'numero_ruc' as snapshot_ruc_empresa,
    (SELECT numero_ruc FROM sistema_facturacion.empresas WHERE id = f.empresa_id) as ruc_empresa_actual,
    f.updated_at
FROM sistema_facturacion.facturas f
WHERE f.snapshot_cliente::jsonb ->> 'numero_identificacion' != 
      (SELECT numero_identificacion FROM sistema_facturacion.clientes WHERE id = f.cliente_id)
   OR f.snapshot_empresa::jsonb ->> 'numero_ruc' != 
      (SELECT numero_ruc FROM sistema_facturacion.empresas WHERE id = f.empresa_id);


RESPONSABILIDAD DEL BACKEND
=============================

1. Al crear factura:
   - Validar que punto_emision pertenezca a establecimiento
   - Recolectar datos ACTUALES de empresa, establecimiento, punto_emision, cliente, usuario
   - Guardarlos en snapshot_datos como JSON
   - Crear factura con estado = 'BORRADOR'
   - Usar el secuencial_actual del punto_emision para numero_factura

2. Antes de emitir:
   - Validar datos de factura (montos, referencias, etc)
   - Generar clave acceso SRI (2-6-numero_ruc-tipo_doc-secuencial-tipo_emision-clave_privada)

3. Al emitir:
   - Crear log_emision_facturas con estado 'EN_PROCESO' inmediatamente  
   - Enviar al SRI
   - Actualizar log_emision_facturas con resultado (EXITOSO o ERROR*)
   - Si EXITOSO: actualizar factura.estado = 'EMITIDA', guardar autorizacion_sri
   - Si ERROR: dejar factura en BORRADOR, usuario puede ver error y reintentar

4. Al recibir pago:
   - Crear log_pago_facturas
   - Recalcular estado_pago (PAGADO/PARCIAL/VENCIDO)

4. La tabla FACTURAS contiene 5 snapshots JSON separados:
   - snapshot_empresa: Datos de la empresa en el momento de emisión
   - snapshot_cliente: Datos del cliente en el momento de emisión
   - snapshot_establecimiento: Datos del establecimiento
   - snapshot_punto_emision: Datos del punto de emisión (con secuencial usado)
   - snapshot_usuario: Datos del usuario que creó/emitió

Para comparar si una referencia fue modificada después:
   SELECT (snapshot_cliente::jsonb ->> 'numero_identificacion') as cedula_snapshot,
          c.numero_identificacion as cedula_actual
   FROM sistema_facturacion.facturas f
   JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
   WHERE f.id = '...';

