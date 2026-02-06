# 📋 PLAN DE IMPLEMENTACIÓN - MÓDULO FACTURAS (BACKEND)

> **Fecha de creación:** 6 de Febrero, 2026  
> **Módulo:** Facturas Electrónicas SRI Ecuador  
> **Prioridad:** Alta (Documento Legal/Tributario)

---

## 📊 PROGRESO GENERAL

```
██████████████░░░░░░ 70% Completado
```

| Fase | Descripción | Estado | % |
|------|-------------|--------|---|
| 1. Base de Datos | Tablas SQL normalizadas | ✅ Completado | 100% |
| 2. Permisos | Definición en permissions.py | ✅ Completado | 100% |
| 3. Schemas | Pydantic models | ✅ Completado | 100% |
| 4. Repository | Consultas SQL | ✅ Completado | 100% |
| 5. Service | Lógica de negocio | ✅ Completado | 100% |
| 6. Router | Endpoints REST | ✅ Completado | 100% |
| 7. Logs | Tablas de auditoría | ⏳ Pendiente | 0% |
| 8. SRI | Integración SRI | ⏳ Pendiente | 0% |
| 9. PDF | Generación RIDE | ⏳ Pendiente | 0% |
| 10. Email | Envío por correo | ⏳ Pendiente | 0% |
| 11. Tests | Pruebas unitarias | ⏳ Pendiente | 0% |

---

## ⚖️ CONTEXTO LEGAL - SRI ECUADOR

Este módulo maneja **documentos tributarios electrónicos** regulados por el Servicio de Rentas Internas (SRI) de Ecuador.

### Requisitos Legales Críticos:

| Requisito | Descripción | Impacto |
|-----------|-------------|---------|
| **Inmutabilidad** | Facturas emitidas NO pueden modificarse | Alto |
| **Snapshots** | Guardar datos originales para auditoría | Alto |
| **Firma Electrónica** | XML debe firmarse con certificado .p12 | Alto |
| **Formato SRI** | Cumplir especificaciones técnicas del SRI | Alto |
| **Clave de Acceso** | 49 dígitos con algoritmo específico | Alto |
| **Secuenciales** | Números únicos por punto de emisión | Alto |
| **Anulación** | Solo facturas emitidas, requiere razón | Medio |

---

## 🔐 MATRIZ DE PERMISOS

### Permisos Definidos (permissions.py)

| Código | Nombre | Tipo | Descripción |
|--------|--------|------|-------------|
| `FACTURAS_VER_TODAS` | Ver todas las facturas | LECTURA | Lista todas las facturas de la empresa |
| `FACTURAS_VER_PROPIAS` | Ver solo mis facturas | LECTURA | Lista solo facturas creadas por el usuario |
| `FACTURAS_CREAR` | Crear facturas | ESCRITURA | Crea factura en estado BORRADOR |
| `FACTURAS_EDITAR` | Editar facturas | ESCRITURA | Edita solo si estado = BORRADOR |
| `FACTURAS_ANULAR` | Anular facturas | ELIMINACION | Cambia estado a ANULADA + razón |
| `FACTURAS_ENVIAR_SRI` | Enviar al SRI | ESPECIAL | Firma y envía al SRI |
| `FACTURAS_DESCARGAR_PDF` | Descargar PDF | LECTURA | Genera RIDE en PDF |
| `FACTURAS_ENVIAR_EMAIL` | Enviar por email | ESPECIAL | Envía factura al cliente |

### Restricción de Rol

Solo usuarios con rol **USUARIO** pueden operar facturas.  
SUPERADMIN puede operar en cualquier empresa (para soporte).  
VENDEDOR **NO puede** crear facturas directamente.

---

## 🗂️ ESTRUCTURA DE ARCHIVOS

```
backend/src/modules/facturas/
├── __init__.py
├── models.py              # ORM Models (si se usan)
├── repository.py          # Consultas SQL
├── router.py              # Endpoints REST
├── schemas.py             # Pydantic: Factura
├── schemas_detalle.py     # Pydantic: DetalleFactura
├── schemas_snapshots.py   # Pydantic: Snapshots JSON   [NUEVO]
├── schemas_logs.py        # Pydantic: Logs emisión/pago [NUEVO]
├── service.py             # Lógica de negocio
├── validators.py          # Validaciones legales SRI   [NUEVO]
└── utils.py               # Utilidades (clave acceso)  [NUEVO]
```

---

## ✅ CHECKLIST DETALLADO

### FASE 1: BASE DE DATOS (100% ✅)

- [x] Crear tabla `facturas` con campos SRI
- [x] Agregar campos de snapshots JSONB (5 campos)
- [x] Crear tabla `log_emision_facturas`
- [x] Crear tabla `autorizacion_sri`
- [x] Crear tabla `log_pago_facturas`
- [x] Crear índices para búsquedas
- [x] Crear índices GIN para snapshots JSON
- [x] Documentación SQL

**Archivos:**
- `db_sistema_facturacion/sistema_facturacion/facturacion/facturas/00-facturas.sql`
- `db_sistema_facturacion/sistema_facturacion/facturacion/facturas/01-log_emision_facturas.sql`
- `db_sistema_facturacion/sistema_facturacion/facturacion/facturas/02-autorizacion_sri.sql`
- `db_sistema_facturacion/sistema_facturacion/facturacion/facturas/03-log_pago_facturas.sql`
- `db_sistema_facturacion/sistema_facturacion/facturacion/facturas/04-indices.sql`

---

### FASE 2: PERMISOS (100% ✅)

- [x] Definir `FACTURAS_VER_TODAS` en PERMISOS_BASE
- [x] Definir `FACTURAS_VER_PROPIAS` en PERMISOS_BASE
- [x] Definir `FACTURAS_CREAR` en PERMISOS_BASE
- [x] Definir `FACTURAS_EDITAR` en PERMISOS_BASE
- [x] Definir `FACTURAS_ANULAR` en PERMISOS_BASE
- [x] Definir `FACTURAS_ENVIAR_SRI` en PERMISOS_BASE
- [x] Definir `FACTURAS_DESCARGAR_PDF` en PERMISOS_BASE
- [x] Definir `FACTURAS_ENVIAR_EMAIL` en PERMISOS_BASE
- [x] Agregar códigos a `PermissionCodes`

**Archivo:** `backend/src/constants/permissions.py`

---

### FASE 3: SCHEMAS PYDANTIC (100% ✅)

#### 3.1 Schemas de Snapshots (100% ✅)
- [x] `SnapshotEmpresa` - Datos empresa al emitir
- [x] `SnapshotCliente` - Datos cliente al emitir
- [x] `SnapshotEstablecimiento` - Datos establecimiento
- [x] `SnapshotPuntoEmision` - Datos punto emisión + secuencial
- [x] `SnapshotUsuario` - Datos usuario que crea/emite

**Archivo creado:** `schemas_snapshots.py`

#### 3.2 Schemas de Factura (100% ✅)
- [x] `FacturaBase` - Campos base
- [x] `FacturaCreacion` - Para crear (sin snapshots manuales)
- [x] `FacturaActualizacion` - Para editar
- [x] `FacturaAnulacion` - Para anular (razón requerida)
- [x] `FacturaLectura` - Respuesta completa con snapshots tipados
- [x] `FacturaListadoFiltros` - Filtros para listado
- [x] `FacturaResumen` - Schema resumido para listados
- [x] `FacturaStats` - Estadísticas para dashboard
- [x] Validador de total (subtotal + propina - descuento)
- [x] Validador de fecha_vencimiento >= fecha_emision
- [x] Pattern para numero_factura (^\d{3}-\d{3}-\d{9}$)

**Archivo:** `schemas.py`

#### 3.3 Schemas de Logs (100% ✅)
- [x] `LogEmisionCreacion` - Registrar intento emisión
- [x] `LogEmisionLectura` - Leer historial emisión
- [x] `LogEmisionListado` - Listado resumido (sin XML)
- [x] `AutorizacionSRICreacion` - Crear autorización
- [x] `AutorizacionSRILectura` - Leer autorización
- [x] `AutorizacionSRIResumen` - Resumen para UI
- [x] `LogPagoCreacion` - Registrar pago
- [x] `LogPagoLectura` - Leer historial pagos
- [x] `ResumenPagos` - Resumen de pagos
- [x] `HistorialEmision` - Historial completo emisión
- [x] `HistorialPagos` - Historial completo pagos

**Archivo creado:** `schemas_logs.py`

---

### FASE 4: REPOSITORY (100% ✅)

#### 4.1 Consultas Base
- [x] `crear_factura()` - INSERT con snapshots JSONB
- [x] `obtener_por_id()` - SELECT por ID
- [x] `listar_facturas()` - SELECT con filtros avanzados
- [x] `actualizar_factura()` - UPDATE (excluye snapshots)
- [x] `eliminar_factura()` - DELETE

#### 4.2 Consultas Nuevas
- [x] Soporte JSONB con `psycopg2.extras.Json`
- [x] Método `_prepare_value()` para conversión automática
- [x] Método `_prepare_data()` para preparar payloads
- [x] Filtro por `usuario_id` (VER_PROPIAS)
- [x] Filtros por `estado`, `estado_pago`, `fecha_desde`, `fecha_hasta`
- [x] Filtros por `cliente_id`, `establecimiento_id`, `punto_emision_id`
- [x] Método `contar_facturas()` para estadísticas
- [x] Protección de snapshots (no se actualizan)

**Archivo:** `repository.py`

---

### FASE 5: SERVICE - LÓGICA DE NEGOCIO (100% ✅)

#### 5.1 Validaciones Legales
- [x] `_validar_rol_usuario()` - Solo rol USUARIO puede operar
- [x] `_validar_empresa_usuario()` - Usuario debe pertenecer a empresa
- [x] `_validar_estado_borrador()` - Solo BORRADOR es editable
- [x] `_validar_estado_para_anular()` - Solo EMITIDA se anula
- [x] `_validar_estado_para_eliminar()` - Solo BORRADOR se elimina

#### 5.2 Métodos de Snapshots
- [x] `_construir_snapshot_empresa()` - JSON de empresa
- [x] `_construir_snapshot_cliente()` - JSON de cliente
- [x] `_construir_snapshot_establecimiento()` - JSON de establecimiento
- [x] `_construir_snapshot_punto_emision()` - JSON de punto emisión
- [x] `_construir_snapshot_usuario()` - JSON de usuario

#### 5.3 Métodos de Negocio
- [x] `crear_factura()` - Con snapshots y validaciones
- [x] `listar_facturas()` - Con filtros y `solo_propias`
- [x] `obtener_factura()` - Con validación de permisos
- [x] `actualizar_factura()` - Validando estado BORRADOR
- [x] `anular_factura()` - Con razón obligatoria
- [x] `eliminar_factura()` - Solo BORRADOR

**Archivo:** `service.py`

---

### FASE 6: ROUTER - ENDPOINTS REST (100% ✅)

#### 6.1 Endpoints de Facturas
- [x] `POST /` - Crear factura (FACTURAS_CREAR)
- [x] `GET /` - Listar todas (FACTURAS_VER_TODAS)
- [x] `GET /mis-facturas` - Listar propias (FACTURAS_VER_PROPIAS)
- [x] `GET /{id}` - Obtener factura
- [x] `PUT /{id}` - Actualizar (FACTURAS_EDITAR)
- [x] `POST /{id}/anular` - Anular factura (FACTURAS_ANULAR)
- [x] `DELETE /{id}` - Eliminar borrador

#### 6.2 Endpoints SRI (Placeholder)
- [x] `POST /{id}/enviar-sri` - Enviar al SRI (FACTURAS_ENVIAR_SRI)
- [x] `GET /{id}/pdf` - Descargar PDF (FACTURAS_DESCARGAR_PDF)
- [x] `POST /{id}/enviar-email` - Enviar email (FACTURAS_ENVIAR_EMAIL)

#### 6.3 Endpoints de Detalles
- [x] Todos actualizados con nuevos permisos

**Archivo:** `router.py`

---

### FASE 7: LOGS DE AUDITORÍA (0% ⏳)

- [ ] Crear service para log_emision_facturas
- [ ] Crear repository para log_emision_facturas
- [ ] Crear service para log_pago_facturas
- [ ] Crear repository para log_pago_facturas
- [ ] Endpoint `GET /{id}/log-emision` - Historial de emisión
- [ ] Endpoint `GET /{id}/log-pagos` - Historial de pagos
- [ ] Endpoint `POST /{id}/pagos` - Registrar pago

**Archivos nuevos o integrar en facturas/**

---

### FASE 8: INTEGRACIÓN SRI (0% ⏳)

- [ ] Generar clave de acceso (49 dígitos)
- [ ] Generar XML según especificaciones SRI
- [ ] Firmar XML con certificado .p12
- [ ] Enviar a WebService de recepción SRI
- [ ] Consultar autorización SRI
- [ ] Manejar errores de SRI (códigos específicos)
- [ ] Guardar XML enviado y respuesta en log
- [ ] Actualizar estado factura tras autorización

**Archivo existente:** `backend/src/modules/sri/`

---

### FASE 9: GENERACIÓN PDF - RIDE (0% ⏳)

- [ ] Diseñar plantilla RIDE según formato SRI
- [ ] Implementar generación PDF (reportlab/weasyprint)
- [ ] Incluir código de barras con clave acceso
- [ ] Incluir QR code (opcional)
- [ ] Endpoint para descarga

---

### FASE 10: ENVÍO POR EMAIL (0% ⏳)

- [ ] Configurar servicio de email (SMTP/SendGrid/SES)
- [ ] Crear plantilla de email
- [ ] Adjuntar PDF y XML
- [ ] Manejar bounces y errores
- [ ] Registrar en log

---

### FASE 11: TESTS (0% ⏳)

- [ ] Tests unitarios para validadores
- [ ] Tests unitarios para service
- [ ] Tests de integración para endpoints
- [ ] Tests de permisos (VER_TODAS vs VER_PROPIAS)
- [ ] Tests de estados (BORRADOR → EMITIDA → ANULADA)
- [ ] Tests de snapshots (inmutabilidad)

---

## 🔄 FLUJO DE ESTADOS

```
                    ┌─────────────┐
                    │   CREAR     │
                    │  (BORRADOR) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │ EDITAR  │  │ ELIMINAR│  │  ENVIAR │
        │(BORRADOR)│  │(BORRADOR)│  │   SRI   │
        └────┬────┘  └─────────┘  └────┬────┘
             │                          │
             └──────────┬───────────────┘
                        │
                        ▼
                  ┌───────────┐
                  │  EMITIDA  │
                  │(inmutable)│
                  └─────┬─────┘
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
        ┌───────────┐       ┌───────────┐
        │  ANULAR   │       │  PAGOS    │
        │ (+ razón) │       │ (parcial/ │
        └─────┬─────┘       │  total)   │
              │             └───────────┘
              ▼
        ┌───────────┐
        │  ANULADA  │
        │  (final)  │
        └───────────┘
```

---

## 📝 VALIDACIONES LEGALES CRÍTICAS

| # | Validación | Ubicación | Código Error | Mensaje |
|---|------------|-----------|--------------|---------|
| 1 | Solo rol USUARIO puede operar | `service._validar_rol_usuario()` | `ROL_NO_AUTORIZADO` | "Solo usuarios con rol USUARIO pueden operar facturas" |
| 2 | Usuario debe pertenecer a empresa | `service._validar_empresa_usuario()` | `AUTH_NO_EMPRESA` | "Usuario sin empresa asignada" |
| 3 | Solo BORRADOR es editable | `service.actualizar_factura()` | `FACTURA_NO_EDITABLE` | "No se puede editar factura en estado X" |
| 4 | Solo EMITIDA se puede anular | `service.anular_factura()` | `FACTURA_BORRADOR_ELIMINAR` | "Facturas en BORRADOR deben eliminarse" |
| 5 | Razón de anulación requerida | `schemas.FacturaAnulacion` | Pydantic validation | "min_length=10" |
| 6 | Total debe cuadrar | `schemas.FacturaCreacion` | Pydantic validation | "Total no coincide con cálculo" |
| 7 | Punto pertenece a establecimiento | `service.crear_factura()` | `VAL_ERROR` | "Punto de emisión no pertenece al establecimiento" |
| 8 | Factura ya anulada | `service.anular_factura()` | `FACTURA_YA_ANULADA` | "La factura ya está anulada" |
| 9 | Formato numero_factura | `schemas.FacturaLectura` | Pydantic pattern | `^\d{3}-\d{3}-\d{9}$` |

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### Inmediato (Completado ✅)
1. ✅ Crear `schemas_snapshots.py` con los 5 schemas de snapshot
2. ✅ Crear `schemas_logs.py` para logs de emisión y pago
3. ✅ Actualizar `schemas.py` con FacturaAnulacion y validadores
4. ✅ Actualizar `service.py` con validaciones legales
5. ✅ Actualizar `router.py` con endpoints y permisos correctos
6. ✅ Actualizar `repository.py` para snapshots JSONB

### Corto Plazo (1-2 semanas) - PENDIENTE
7. ⏳ Crear repository para log_emision_facturas
8. ⏳ Crear repository para log_pago_facturas
9. ⏳ Crear service para logs de emisión y pago
10. ⏳ Endpoints `GET /{id}/log-emision` - Historial de emisión
11. ⏳ Endpoints `GET /{id}/log-pagos` - Historial de pagos
12. ⏳ Endpoint `POST /{id}/pagos` - Registrar pago

### Mediano Plazo (2-4 semanas) - PENDIENTE
13. ⏳ Generar clave de acceso (49 dígitos)
14. ⏳ Generar XML según especificaciones SRI
15. ⏳ Firmar XML con certificado .p12
16. ⏳ Enviar a WebService SRI
17. ⏳ Implementar generación de PDF (RIDE)
18. ⏳ Implementar envío por email
19. ⏳ Crear tests completos

---

## 📚 REFERENCIAS

- [Ficha Técnica SRI - Facturación Electrónica](https://www.sri.gob.ec/facturacion-electronica)
- [Especificaciones XML SRI v2.1](https://www.sri.gob.ec/DocumentosAlfrescoPortlet/descargar/...)
- [Códigos de Error SRI](https://www.sri.gob.ec/...)

---

## 📌 NOTAS IMPORTANTES

1. **Snapshots son INMUTABLES**: Una vez creada la factura, los snapshots NO se modifican (auditoría)
2. **Secuenciales son únicos**: Cada punto de emisión tiene su propio contador
3. **XML se guarda siempre**: Tanto el enviado como la respuesta del SRI
4. **Logs son append-only**: No se eliminan registros de log_emision ni log_pago
5. **Anulación requiere razón**: Mínimo 10 caracteres, para auditoría SRI

---

*Última actualización: 6 de Febrero, 2026 - Fases 1-6 completadas (70%)*
