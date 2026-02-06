# Estructura de Facturas - Base de Datos

Esta carpeta contiene los scripts SQL para crear la estructura completa de facturación con auditoría normalizada.

## 📋 Archivos y Orden de Ejecución

```
00-facturas.sql
   └─ Tabla principal: sistema_facturacion.facturas
      Contiene 5 snapshots JSON independientes (empresa, cliente, establecimiento, punto_emision, usuario)
      Estados: BORRADOR, EMITIDA, ANULADA
      Estados de pago: PENDIENTE, PAGADO, PARCIAL, VENCIDO

01-log_emision_facturas.sql
   └─ Tabla de auditoría: sistema_facturacion.log_emision_facturas
      Rastreo de intentos de emisión al SRI
      Múltiples intentos por factura (INICIAL, REINTENTO, CONTINGENCIA, RECTIFICACION)
      Estados: EN_PROCESO, EXITOSO, ERROR_VALIDACION, ERROR_CONECTIVIDAD, ERROR_OTRO

02-autorizacion_sri.sql
   └─ Tabla de auditoría: sistema_facturacion.autorizacion_sri
      Una sola autorización por factura
      Datos de la respuesta del SRI

03-log_pago_facturas.sql
   └─ Tabla de auditoría: sistema_facturacion.log_pago_facturas
      Múltiples pagos por factura (cuotas, abonos, etc.)
      Métodos: EFECTIVO, TRANSFERENCIA, TARJETA, CHEQUE, DEPOSITO, OTRO

04-indices.sql
   └─ Índices para todas las búsquedas comunes
      Índices normales para referencias y estados
      Índices GIN para búsquedas en snapshots JSON

05-documentacion.sql
   └─ Documentación completa del ciclo de vida
      Ejemplos de INSERT, UPDATE para cada paso
      Queries útiles para auditoría
      Estructura de los JSON snapshots
```

## 🔄 Flujo de Ejecución Recomendado

```bash
-- Ejecutar en este orden:
1. psql -d tu_base_de_datos -f 00-facturas.sql
2. psql -d tu_base_de_datos -f 01-log_emision_facturas.sql
3. psql -d tu_base_de_datos -f 02-autorizacion_sri.sql
4. psql -d tu_base_de_datos -f 03-log_pago_facturas.sql
5. psql -d tu_base_de_datos -f 04-indices.sql
6. psql -d tu_base_de_datos -f 05-documentacion.sql (opcional - solo referencia)
```

O crear un script que los ejecute todos:
```sql
\i '00-facturas.sql'
\i '01-log_emision_facturas.sql'
\i '02-autorizacion_sri.sql'
\i '03-log_pago_facturas.sql'
\i '04-indices.sql'
\i '05-documentacion.sql'
```

## 🎯 Estructura de Snapshots (JSON)

Cada factura guarda 5 snapshots JSON independientes al momento de su creación:

### snapshot_empresa
```json
{
    "id": "uuid",
    "numero_ruc": "0999999999999",
    "razon_social": "EMPRESA ABC CIA LTDA",
    "nombre_comercial": "ABC",
    "email": "info@empresa.com",
    "telefono": "022123456",
    "direccion": "Calle Principal 123",
    "ciudad": "Quito",
    "provincia": "Pichincha"
}
```

### snapshot_cliente
```json
{
    "id": "uuid",
    "tipo_identificacion": "RUC",
    "numero_identificacion": "1234567890123",
    "nombres": "Juan",
    "apellidos": "Pérez García",
    "email": "juan@email.com",
    "telefono": "0987654321",
    "direccion": "Calle Secundaria 456",
    "ciudad": "Quito",
    "provincia": "Pichincha"
}
```

### snapshot_establecimiento
```json
{
    "id": "uuid",
    "codigo": "001",
    "nombre": "Matriz",
    "direccion": "Calle Principal 123",
    "ciudad": "Quito",
    "provincia": "Pichincha"
}
```

### snapshot_punto_emision
```json
{
    "id": "uuid",
    "codigo": "001",
    "nombre": "Punto de Emisión Principal",
    "establecimiento_id": "uuid",
    "secuencial_actual": 5
}
```

### snapshot_usuario
```json
{
    "id": "uuid",
    "nombre": "Carlos",
    "apellido": "López",
    "email": "carlos@empresa.com",
    "rol": "vendedor"
}
```

## 📊 Diagrama de Estados

```
EMISIÓN                        PAGO
--------                       ----
BORRADOR ─────→ EMITIDA       PENDIENTE ──→ PAGADO
           (SRI autoriza)         (100% pago)
         ↓
       ANULADA                  PARCIAL ←──┐
       (cancelada)              (< 100%)   │
                                           └─ VENCIDO
                                         (fecha vencida)
```

## 🔐 Auditoría y Trazabilidad

cada movimiento se registra en tablas separadas:

1. **log_emision_facturas**
   - Cada intento de envío al SRI
   - XML enviado y respuesta
   - Errores si ocurren
   - Permite reintentos sin duplicar factura

2. **autorizacion_sri**
   - Solo la autorización final exitosa
   - Número de autorización del SRI
   - Fecha/hora de autorización

3. **log_pago_facturas**
   - Cada pago registrado
   - Múltiples cuotas permitidas
   - Rastreo de comprobantes

4. **snapshots_* (JSON)**
   - Captura de datos al momento de creación
   - Permite auditoría: comparar snapshot vs datos actuales
   - Si datos de cliente/empresa cambian, factura mantiene los originales

## 🔄 Ciclo de Vida Ejemplo

```
1. Usuario crea factura
   → INSERT facturas (estado: BORRADOR, estado_pago: PENDIENTE)
   → Snapshots se guardan automáticamente
   
2. Usuario emite al SRI
   → INSERT log_emision_facturas (EN_PROCESO)
   → SRI responde
   → UPDATE facturas (estado: EMITIDA)
   → INSERT autorizacion_sri (AUTORIZADO)
   
3. Cliente paga parcialmente
   → INSERT log_pago_facturas (monto 50 de 112)
   → UPDATE facturas (estado_pago: PARCIAL, updated_at: NOW())
   
4. Cliente paga el resto
   → INSERT log_pago_facturas (monto 62 de 112)
   → UPDATE facturas (estado_pago: PAGADO)
   
5. Auditoría: Ver si cliente cambió RUC
   → SELECT snapshot_cliente ->> 'numero_identificacion' vs tabla clientes
   → Si es diferente: datos fueron modificados después de emisión
```

## 💡 Ventajas de esta Estructura

✅ **Separación de responsabilidades**: Estados de emisión y pago independientes  
✅ **Auditoría completa**: Cada cambio queda registrado  
✅ **Reintentos seguros**: Si falla emisión, se reintentan sin duplicar factura  
✅ **Cuotas/Abonos**: Los pagos pueden ser parciales y múltiples  
✅ **Trazabilidad SRI**: Se guarda todo XML enviado y recibido  
✅ **Snapshots**: Datos originales preservados para auditoría  
✅ **Performance**: Índices GIN para búsquedas en JSON  

## 📝 Notas Importantes

- Los **snapshots se guardan UNA SOLA VEZ** al crear la factura y NUNCA se modifican
- El backend **DEBE calcular** estado_pago basado en suma de log_pago_facturas
- Usar always **snapshots** en reportes/impresión, NUNCA hacer JOIN directo con tablas maestras
- Los logs de emisión y pago son la **fuente de verdad** para auditoría
- Una factura en BORRADOR puede ser **reeditada** antes de emitir, pero actualizar snapshots si referencias cambian
