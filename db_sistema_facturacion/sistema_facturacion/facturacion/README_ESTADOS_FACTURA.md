# Estados de Factura - Normalización

## Resumen de Cambios

La tabla `facturas` ha sido **normalizada** para separar los estados de facturación en dos dimensiones independientes:

1. **ESTADO DE EMISIÓN** (tabla `facturas.estado`) - ¿Se envió al SRI?
2. **ESTADO DE PAGO** (tabla `facturas.estado_pago`) - ¿Se pagó?

Además, se crearon tres **tablas de auditoría** para registrar toda la historia:
- `log_emision_facturas` - Intentos de emisión al SRI
- `autorizacion_sri` - Autorización final del SRI
- `log_pago_facturas` - Historial de pagos

---

## 📊 Estados de Emisión

```
BORRADOR → EMITIDA → ANULADA
```

| Estado | Significado | Transiciones Posibles |
|--------|-------------|---------------------|
| **BORRADOR** | Factura creada pero NO enviada aún al SRI | → EMITIDA (al emitir) |
| **EMITIDA** | Factura enviada y AUTORIZADA por el SRI | → ANULADA (si se cancela) |
| **ANULADA** | Factura cancelada/devuelta | Final (no hay transiciones) |

---

## 💰 Estados de Pago

```
PENDIENTE → PAGADO
    ↓
 PARCIAL
    ↓
 VENCIDO
```

| Estado | Significado | Cuándo Ocurre |
|--------|-------------|---------------|
| **PENDIENTE** | Sin pagos registrados | Por defecto al crear |
| **PARCIAL** | Pagado parcialmente | Cuando monto_pagado < total |
| **PAGADO** | Pagado completamente | Cuando monto_pagado = total |
| **VENCIDO** | Pasó fecha de vencimiento sin pagar | Cuando fecha_vencimiento < hoy y estado ≠ PAGADO |

---

## 🔄 Flujo Completo de Factura

### Escenario: Factura Manual y Exitosa

```
1. CREAR FACTURA
   └─ INSERT facturas
      - estado: BORRADOR
      - estado_pago: PENDIENTE
      - snapshot_datos: {datos actuales}

2. EMITIR AL SRI
   ├─ INSERT log_emision_facturas (EN_PROCESO)
   ├─ Enviar XML al SRI
   └─ SRI RESPONDE
      ├─ SI EXITOSO:
      │  ├─ UPDATE facturas → estado: EMITIDA
      │  ├─ INSERT autorizacion_sri (AUTORIZADO)
      │  └─ UPDATE log_emision_facturas → estado: EXITOSO
      └─ SI ERROR:
         ├─ UPDATE log_emision_facturas → estado: ERROR_*
         └─ facturas sigue en BORRADOR (usuario puede reintentar)

3. RECIBIR PAGO
   ├─ INSERT log_pago_facturas (nuevo pago)
   └─ UPDATE facturas
      └─ estado_pago: PENDIENTE → PARCIAL → PAGADO
```

---

## 📋 Tablas Involucradas

### 1. `facturas` (Principal)
```sql
- id (PK)
- empresa_id, establecimiento_id, punto_emision_id, cliente_id, usuario_id
- numero_factura (001-001-000000001)
- estado ➜ BORRADOR | EMITIDA | ANULADA
- estado_pago ➜ PENDIENTE | PAGADO | PARCIAL | VENCIDO
- snapshot_datos (JSONB) - Datos de referencias al momento de emisión
- Montos: subtotal_sin_iva, iva, descuento, propina, retencion_iva, retencion_renta, total
```

### 2. `log_emision_facturas` (Auditoría de Emisión)
```sql
- factura_id (FK)
- tipo_intento ➜ INICIAL | REINTENTO | CONTINGENCIA | RECTIFICACION
- estado ➜ EN_PROCESO | EXITOSO | ERROR_VALIDACION | ERROR_CONECTIVIDAD | ERROR_OTRO
- intento_numero (1, 2, 3, ...)
- codigo_error, mensaje_error
- xml_enviado, xml_respuesta
- usuario_id (quién hizo el intento)
- timestamp (cuándo)

→ Permite ver TODO el historial de intentos de una factura
```

### 3. `autorizacion_sri` (Autorización Final)
```sql
- factura_id (PK, UNIQUE)
- numero_autorizacion (del SRI)
- fecha_autorizacion
- estado ➜ AUTORIZADO | NO_AUTORIZADO | DEVUELTO | CANCELADO
- mensajes (JSONB)
- xml_enviado, xml_respuesta

→ Una sola autorización por factura (la exitosa)
```

### 4. `log_pago_facturas` (Auditoría de Pagos)
```sql
- factura_id (FK)
- usuario_id
- monto, fecha_pago
- metodo_pago ➜ EFECTIVO | TRANSFERENCIA | TARJETA | CHEQUE | DEPOSITO | OTRO
- numero_referencia (número de cheque, referencia banco, etc)
- comprobante_url
- observaciones
- timestamp

→ Permite ver TODO el historial de pagos (cuotas, abonos, etc.)
```

---

## 🛠️ Ejemplos de Uso - Backend

### Crear Factura (BORRADOR)
```python
# 1. Recolectar datos actuales
empresa = obtener_empresa(empresa_id)
establecimiento = obtener_establecimiento(establecimiento_id)
punto_emision = obtener_punto_emision(punto_emision_id)
cliente = obtener_cliente(cliente_id)
usuario = obtener_usuario(usuario_id)

# 2. Construir snapshot
snapshot = {
    "empresa": {"id": empresa.id, "nombre": empresa.nombre, "ruc": empresa.ruc},
    "establecimiento": {"id": est.id, "codigo": est.codigo, "nombre": est.nombre},
    "punto_emision": {"id": pe.id, "codigo": pe.codigo, "secuencial_actual": pe.secuencial_actual},
    "cliente": {"id": cliente.id, "nombre": cliente.nombre, "ruc": cliente.ruc_cedula},
    "usuario": {"id": usuario.id, "nombre": usuario.nombre, "email": usuario.email}
}

# 3. Crear factura
factura = Factura(
    empresa_id=empresa_id,
    establecimiento_id=establecimiento_id,
    punto_emision_id=punto_emision_id,
    cliente_id=cliente_id,
    usuario_id=usuario_id,
    numero_factura="001-001-000000001",
    secuencial_punto_emision=1,
    estado="BORRADOR",  # ← Inicialmente BORRADOR
    estado_pago="PENDIENTE",
    snapshot_datos=snapshot,
    # ... resto de montos ...
)
db.save(factura)
```

### Emitir al SRI
```python
# 1. Registrar intento
log = LogEmisionFacturas(
    factura_id=factura.id,
    tipo_intento="INICIAL",
    estado="EN_PROCESO",
    intento_numero=1,
    usuario_id=usuario.id
)
db.save(log)

# 2. Generar XML y enviar
xml = generar_xml_sri(factura)
log.xml_enviado = xml
db.update(log)

try:
    # 3. Enviar al SRI
    respuesta = enviar_a_sri(xml)
    
    if respuesta.autorizado:
        # 4. ÉXITO: Actualizar factura
        factura.estado = "EMITIDA"
        factura.clave_acceso = respuesta.clave_acceso
        factura.numero_autorizacion = respuesta.numero_autorizacion
        factura.fecha_autorizacion = respuesta.fecha_autorizacion
        db.update(factura)
        
        # 5. Guardar autorización
        autorizacion = AutorizacionSRI(
            factura_id=factura.id,
            numero_autorizacion=respuesta.numero_autorizacion,
            fecha_autorizacion=respuesta.fecha_autorizacion,
            estado="AUTORIZADO",
            xml_respuesta=respuesta.xml
        )
        db.save(autorizacion)
        
        # 6. Actualizar log
        log.estado = "EXITOSO"
        log.xml_respuesta = respuesta.xml
        db.update(log)
        
    else:
        # ERROR: No actualizar factura, solo log
        log.estado = "ERROR_VALIDACION"
        log.codigo_error = respuesta.codigo
        log.mensaje_error = respuesta.mensaje
        log.xml_respuesta = respuesta.xml
        db.update(log)
        
except Exception as e:
    # ERROR DE CONECTIVIDAD
    log.estado = "ERROR_CONECTIVIDAD"
    log.mensaje_error = str(e)
    db.update(log)
```

### Registrar Pago
```python
# 1. Crear registro de pago
pago = LogPagoFacturas(
    factura_id=factura.id,
    usuario_id=usuario.id,
    monto=100.00,
    fecha_pago=date.today(),
    metodo_pago="TRANSFERENCIA",
    numero_referencia="TRF-12345",
    comprobante_url="https://..."
)
db.save(pago)

# 2. Recalcular estado_pago
total_pagos = db.query(LogPagoFacturas)\
    .filter(LogPagoFacturas.factura_id == factura.id)\
    .sum(LogPagoFacturas.monto)

if total_pagos >= factura.total:
    factura.estado_pago = "PAGADO"
elif total_pagos > 0:
    factura.estado_pago = "PARCIAL"
elif factura.fecha_vencimiento < date.today():
    factura.estado_pago = "VENCIDO"
else:
    factura.estado_pago = "PENDIENTE"

db.update(factura)
```

---

## 🔍 Queries Útiles

### Ver historial completo de una factura
```sql
SELECT 
    f.id,
    f.numero_factura,
    f.estado as estado_emision,
    f.estado_pago,
    
    -- Último intento de emisión
    (SELECT estado FROM sistema_facturacion.log_emision_facturas 
     WHERE factura_id = f.id 
     ORDER BY timestamp DESC LIMIT 1) as ultimo_intento_emision,
    
    -- Total pagado
    COALESCE(
        (SELECT SUM(monto) FROM sistema_facturacion.log_pago_facturas WHERE factura_id = f.id), 
        0
    ) as total_pagado,
    
    f.total,
    f.created_at,
    f.updated_at

FROM sistema_facturacion.facturas f
WHERE f.id = :factura_id;
```

### Ver facturas vencidas sin pagar
```sql
SELECT 
    f.id,
    f.numero_factura,
    f.cliente_id,
    f.total,
    COALESCE(SUM(p.monto), 0) as pagado,
    f.total - COALESCE(SUM(p.monto), 0) as adeuda,
    f.fecha_vencimiento,
    CURRENT_DATE - f.fecha_vencimiento as dias_vencido
    
FROM sistema_facturacion.facturas f
LEFT JOIN sistema_facturacion.log_pago_facturas p ON f.id = p.factura_id
WHERE f.estado = 'EMITIDA'
  AND f.estado_pago != 'PAGADO'
  AND f.fecha_vencimiento < CURRENT_DATE
GROUP BY f.id, f.numero_factura, f.cliente_id, f.total, f.fecha_vencimiento
ORDER BY dias_vencido DESC;
```

### Ver intentos de emisión fallidos
```sql
SELECT 
    f.numero_factura,
    le.tipo_intento,
    le.intento_numero,
    le.estado,
    le.codigo_error,
    le.mensaje_error,
    le.timestamp

FROM sistema_facturacion.log_emision_facturas le
JOIN sistema_facturacion.facturas f ON le.factura_id = f.id
WHERE le.estado LIKE 'ERROR%'
  AND le.timestamp > NOW() - INTERVAL '24 hours'
ORDER BY le.timestamp DESC;
```

---

## ✅ Ventajas de Esta Normalización

1. **Separación de Responsabilidades**: Estado de emisión ≠ Estado de pago
2. **Auditoría Completa**: Cada cambio importante está registrado
3. **Reintentos Fáciles**: Si falla emisión, se reintentan sin duplicar factura
4. **Cuotas/Abonos**: Los pagos pueden ser parciales y registrarse múltiples veces
5. **Trazabilidad**: Se ve exactamente qué pasó, cuándo y quién lo hizo
6. **SRI Compliance**: Todos los datos necesarios para auditoría de impuestos

---

## 📝 Notas de Implementación

- El `snapshot_datos` se guarda al **crear la factura** y nunca se modifica (auditoría)
- El backend **DEBE calcular** el `estado_pago` basado en pagos registrados
- Los logs se escriben automáticamente: uno por intento, uno por pago
- La factura **sigue en BORRADOR** si hay errores de emisión (usuario puede reintentar)
- Usar `log_emision_facturas` como el source of truth para el status de emisión
