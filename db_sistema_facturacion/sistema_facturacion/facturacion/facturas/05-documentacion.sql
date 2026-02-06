-- ===================================================================
-- DOCUMENTACIÓN: Ciclo de Vida y Ejemplos de Uso
-- ===================================================================

/*

FLUJO DE FACTURACIÓN NORMALIZADO
================================

La factura pasa por dos ciclos independientes:

1. ESTADO DE EMISIÓN (tabla facturas.estado):
   - BORRADOR: Factura creada pero NO enviada al SRI
   - EMITIDA: Factura enviada y autorizada por el SRI  
   - ANULADA: Factura cancelada

2. ESTADO DE PAGO (tabla facturas.estado_pago):
   - PENDIENTE: Sin pagar
   - PAGADO: Pagada en su totalidad
   - PARCIAL: Pagada pero sin llegar al total
   - VENCIDO: Pasó la fecha de vencimiento sin pagar


CICLO DE VIDA COMPLETO
======================

PASO 1: CREAR FACTURA (estado = BORRADOR)
------------------------------------------
INSERT INTO sistema_facturacion.facturas (
    empresa_id, establecimiento_id, punto_emision_id, cliente_id, usuario_id,
    numero_factura, secuencial_punto_emision,
    tipo_documento, ambiente, tipo_emision,
    fecha_emision, fecha_vencimiento,
    subtotal_sin_iva, subtotal_con_iva, iva, descuento, propina,
    retencion_iva, retencion_renta, total,
    estado, estado_pago, origen,
    snapshot_empresa, snapshot_cliente, snapshot_establecimiento,
    snapshot_punto_emision, snapshot_usuario,
    observaciones
) VALUES (
    '...empresa_id...', '...establecimiento_id...', '...punto_id...', 
    '...cliente_id...', '...usuario_id...',
    '001-001-000000001', 1,
    '01', 2, 1,
    CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
    100.00, 112.00, 12.00, 0, 0, 0, 0, 112.00,
    'BORRADOR', 'PENDIENTE', 'MANUAL',
    
    -- Snapshots: Datos actuales de referencias
    '{"id": "uuid-empresa", "numero_ruc": "0123456789", "razon_social": "Empresa S.A.", "email": "info@empresa.com"}',
    '{"id": "uuid-cliente", "tipo_identificacion": "RUC", "numero_identificacion": "0987654321", "nombres": "Juan", "apellidos": "Perez"}',
    '{"id": "uuid-estab", "codigo": "001", "nombre": "Matriz", "direccion": "Calle 1"}',
    '{"id": "uuid-pe", "codigo": "001", "nombre": "Punto 1", "secuencial_actual": 1}',
    '{"id": "uuid-user", "nombre": "Carlos", "email": "carlos@empresa.com"}',
    'Factura creada manualmente'
);


PASO 2: EMITIR FACTURA AL SRI (estado → EMITIDA)
-------------------------------------------------
a) Registrar intento de emisión:
   INSERT INTO sistema_facturacion.log_emision_facturas (
       factura_id, tipo_intento, estado, intento_numero,
       usuario_id, observaciones
   ) VALUES (
       '...factura_id...', 'INICIAL', 'EN_PROCESO', 1,
       '...usuario_id...', 'Enviando al SRI'
   );

b) Si el SRI autoriza exitosamente:
   -- Actualizar factura
   UPDATE sistema_facturacion.facturas
   SET estado = 'EMITIDA',
       clave_acceso = '3008202501099999001001000000000010123456789',
       numero_autorizacion = '0308202500112345',
       fecha_autorizacion = NOW(),
       updated_at = NOW()
   WHERE id = '...factura_id...';
   
   -- Registrar autorización del SRI
   INSERT INTO sistema_facturacion.autorizacion_sri (
       factura_id, numero_autorizacion, fecha_autorizacion,
       estado, xml_enviado, xml_respuesta
   ) VALUES (
       '...factura_id...', '0308202500112345', NOW(),
       'AUTORIZADO', '...xml enviado...', '...xml respuesta...'
   );
   
   -- Actualizar log con éxito
   UPDATE sistema_facturacion.log_emision_facturas
   SET estado = 'EXITOSO',
       xml_respuesta = '...xml respuesta...'
   WHERE factura_id = '...factura_id...'
   ORDER BY timestamp DESC LIMIT 1;

c) Si hay error:
   -- Registrar el error en log (factura sigue en BORRADOR)
   UPDATE sistema_facturacion.log_emision_facturas
   SET estado = 'ERROR_VALIDACION',
       codigo_error = 'INVALID_RUC',
       mensaje_error = 'RUC no válido'
   WHERE factura_id = '...factura_id...'
   ORDER BY timestamp DESC LIMIT 1;
   
   -- NO actualizar factura.estado (sigue en BORRADOR)
   -- Usuario puede ver el error y reintentar


PASO 3: REGISTRAR PAGOS (estado_pago → PAGADO | PARCIAL)
----------------------------------------------------------
Cuando se recibe un pago:

INSERT INTO sistema_facturacion.log_pago_facturas (
    factura_id, usuario_id,
    monto, fecha_pago,
    metodo_pago, numero_referencia, comprobante_url,
    observaciones
) VALUES (
    '...factura_id...', '...usuario_id...',
    56.00, CURRENT_DATE,
    'TRANSFERENCIA', 'TRF-2024-001', 'https://...',
    'Pago parcial inicial'
);

Luego actualizar estado_pago según total pagado:
-- Si suma de pagos >= total → estado_pago = 'PAGADO'
-- Si suma parcial y no vencida → estado_pago = 'PARCIAL'
-- Si suma parcial y vencida → estado_pago = 'VENCIDO'

UPDATE sistema_facturacion.facturas
SET estado_pago = 'PARCIAL',
    updated_at = NOW()
WHERE id = '...factura_id...';


PASO 4: ANULAR FACTURA (estado → ANULADA)
-------------------------------------------
Si necesita anularse:

UPDATE sistema_facturacion.facturas
SET estado = 'ANULADA',
    razon_anulacion = 'Error en datos del cliente',
    updated_at = NOW()
WHERE id = '...factura_id...';

-- Los logs de emisión y pago quedan intactos para auditoría


SNAPSHOTS JSON - ESTRUCTURA
==========================

snapshot_empresa:
{
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "numero_ruc": "0999999999999",
    "razon_social": "EMPRESA ABC CIA LTDA",
    "nombre_comercial": "ABC",
    "email": "info@empresa.com",
    "telefono": "022123456",
    "direccion": "Calle Principal 123",
    "ciudad": "Quito",
    "provincia": "Pichincha"
}

snapshot_cliente:
{
    "id": "7fa85f64-5717-4562-b3fc-2c963f66afa6",
    "tipo_identificacion": "RUC",
    "numero_identificacion": "1234567890123",
    "nombres": "Juan",
    "apellidos": "Pérez García",
    "razon_social": null,
    "email": "juan@email.com",
    "telefono": "0987654321",
    "direccion": "Calle Secundaria 456",
    "ciudad": "Quito",
    "provincia": "Pichincha"
}

snapshot_establecimiento:
{
    "id": "8fa85f64-5717-4562-b3fc-2c963f66afa6",
    "codigo": "001",
    "nombre": "Matriz",
    "direccion": "Calle Principal 123",
    "ciudad": "Quito",
    "provincia": "Pichincha"
}

snapshot_punto_emision:
{
    "id": "9fa85f64-5717-4562-b3fc-2c963f66afa6",
    "codigo": "001",
    "nombre": "Punto de Emisión Principal",
    "establecimiento_id": "8fa85f64-5717-4562-b3fc-2c963f66afa6",
    "secuencial_actual": 5
}

snapshot_usuario:
{
    "id": "afa85f64-5717-4562-b3fc-2c963f66afa6",
    "nombre": "Carlos",
    "apellido": "López",
    "email": "carlos@empresa.com",
    "rol": "vendedor"
}


QUERIES ÚTILES
==============

-- Listar facturas pendientes de pago y vencidas
SELECT 
    f.id,
    f.numero_factura,
    (f.snapshot_cliente::jsonb ->> 'nombres') as cliente,
    f.total,
    f.estado_pago,
    f.fecha_vencimiento,
    CURRENT_DATE - f.fecha_vencimiento as dias_vencido
FROM sistema_facturacion.facturas f
WHERE f.estado_pago != 'PAGADO'
  AND f.fecha_vencimiento < CURRENT_DATE
  AND f.estado = 'EMITIDA'
ORDER BY f.fecha_vencimiento ASC;

-- Ver historial completo de una factura
SELECT 
    f.numero_factura,
    f.estado,
    f.estado_pago,
    f.total,
    
    -- Último intento de emisión
    (SELECT estado FROM sistema_facturacion.log_emision_facturas 
     WHERE factura_id = f.id 
     ORDER BY timestamp DESC LIMIT 1) as ultimo_intento,
    
    -- Total pagado hasta ahora
    COALESCE(
        (SELECT SUM(monto) FROM sistema_facturacion.log_pago_facturas WHERE factura_id = f.id), 
        0
    ) as total_pagado
FROM sistema_facturacion.facturas f
WHERE f.id = '...factura_id...';

-- Ventasturas con datos modificados (auditoría)
-- Compara snapshot vs datos actuales
SELECT 
    f.numero_factura,
    (f.snapshot_cliente::jsonb ->> 'numero_identificacion') as cedula_snapshot,
    c.numero_identificacion as cedula_actual,
    CASE WHEN (f.snapshot_cliente::jsonb ->> 'numero_identificacion') != c.numero_identificacion 
         THEN 'MODIFICADO' ELSE 'OK' END as status
FROM sistema_facturacion.facturas f
JOIN sistema_facturacion.clientes c ON f.cliente_id = c.id
WHERE (f.snapshot_cliente::jsonb ->> 'numero_identificacion') != c.numero_identificacion
   OR (f.snapshot_empresa::jsonb ->> 'numero_ruc') != (SELECT numero_ruc FROM sistema_facturacion.empresas WHERE id = f.empresa_id);

-- Intentos de emisión fallidos en últimas 24 horas
SELECT 
    f.numero_factura,
    le.tipo_intento,
    le.estado,
    le.codigo_error,
    le.mensaje_error,
    le.timestamp,
    (SELECT nombre FROM sistema_facturacion.usuarios WHERE id = le.usuario_id) as usuario
FROM sistema_facturacion.log_emision_facturas le
JOIN sistema_facturacion.facturas f ON le.factura_id = f.id
WHERE le.estado LIKE 'ERROR%'
  AND le.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY le.timestamp DESC;

-- Factura recién pagada - calcular totales
SELECT 
    f.numero_factura,
    f.total,
    COALESCE(SUM(p.monto), 0) as total_pagado,
    f.total - COALESCE(SUM(p.monto), 0) as saldo_pendiente,
    f.estado_pago
FROM sistema_facturacion.facturas f
LEFT JOIN sistema_facturacion.log_pago_facturas p ON f.id = p.factura_id
WHERE f.id = '...factura_id...'
GROUP BY f.id, f.numero_factura, f.total, f.estado_pago;


RESPONSABILIDAD DEL BACKEND
=============================

1. AL CREAR FACTURA:
   - Validar que punto_emision pertenezca a establecimiento
   - Recolectar datos ACTUALES de empresa, establecimiento, punto_emision, cliente, usuario
   - Guardarlos en cada snapshot_* como JSONB
   - Crear factura con estado = 'BORRADOR'

2. ANTES DE EMITIR:
   - Validar datos de factura (montos, referencias, etc)
   - Generar clave de acceso SRI (algoritmo específico)

3. AL EMITIR:
   - Crear log_emision_facturas con estado 'EN_PROCESO'  
   - Enviar XML al SRI
   - Actualizar log_emision_facturas con resultado (EXITOSO o ERROR*)
   - Si EXITOSO: actualizar factura.estado = 'EMITIDA' + autorizacion_sri
   - Si ERROR: dejar factura en BORRADOR, usuario puede reintentar

4. AL REGISTRAR PAGO:
   - Crear log_pago_facturas
   - Recalcular estado_pago basado en suma de pagos

5. AL ANULAR:
   - UPDATE factura.estado = 'ANULADA'
   - Guardar razón en razon_anulacion
   - Los logs quedan para auditoría

*/
