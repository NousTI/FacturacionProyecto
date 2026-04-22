# Guía de Flujo de Trabajo: El Estándar Legal SRI (Actualizado)

Esta guía documenta el ciclo de vida de una factura bajo la normativa técnica del SRI Ecuador y la implementación lógica del sistema, definiendo los estados precisos, las medidas de contingencia y las acciones automáticas.

---

## 1. El Ciclo de Vida de una Factura

### 1.1. Pre-Envío
1.  **Estado: `BORRADOR`**
    *   **Acción:** Creación y edición de datos (emisor, receptor, detalles, formas de pago).
    *   **Validación Local:** El sistema valida algoritmos de RUC/Cédula y cálculos de impuestos antes de permitir el envío.
    *   **Clave de Acceso:** Aún no se genera permanentemente.

### 1.2. Proceso de Emisión (Orquestación SRI)
Al presionar **"Enviar al SRI"**, el sistema ejecuta:
1.  **Fase de Generación:** Se crea el XML y se genera la **Clave de Acceso Idempotente** (calculada a partir del ID de la factura para evitar duplicidad de claves en reintentos).
2.  **Fase de Firma:** Se firma el XML con el certificado digital (XAdES-BES).
3.  **Fase 1: Recepción:** Envío al Web Service de Recepción del SRI.
4.  **Fase 2: Autorización:** Consulta al Web Service de Autorización del SRI (tras una espera de ~3 segundos).

---

## 2. Matriz de Estados y Medidas de Acción

El sistema clasifica el resultado del envío en uno de los siguientes estados:

| Estado Local | Contexto SRI | Riesgo de Clave | Acción Requerida |
| :--- | :--- | :---: | :--- |
| **`BORRADOR`** | No existe en el SRI. | Ninguno | Editar o Enviar. |
| **`EN_PROCESO`** | Recibida pero en cola de procesamiento. | **ALTO** | El sistema bloquea edición. Solo se permite **"Consultar al SRI"**. |
| **`ERROR_TECNICO`**| Falló la red o el SRI está offline (Timeout). | Bajo | Botón **"Reintentar"**. El sistema usa la misma clave de acceso. |
| **`DEVUELTA`** | Error en estructura XML o firma. | Medio | **Editar y Corregir**. Generalmente no requiere nueva clave a menos que se cambie la fecha. |
| **`NO_AUTORIZADA`** | Error lógico (negocio/tributario). | **CRÍTICO** | **Obligatorio: Nueva Clave**. Se debe corregir el dato y el sistema generará una clave distinta al reintentar. |
| **`AUTORIZADA`** | Procesada exitosamente. | Ninguno | Generar RIDE, enviar Email y archivar. No editable. |

---

## 3. Manejo de Errores y Medidas de Contingencia

### 3.1. Idempotencia de la Clave de Acceso
*   **Implementación:** El "Código Numérico" de la clave ya no es aleatorio. Se deriva de forma determinística del UUID de la factura en la base de datos.
*   **Objetivo:** Si el sistema envía la factura y hay un timeout, pero el SRI sí la recibió, al reintentar el sistema generará la **exactamente la misma clave**, evitando el error `"CLAVE REGISTRADA"` y permitiendo que el SRI simplemente devuelva el estado de autorización actual.

### 3.2. Tratamiento del Error "70 - Clave de Acceso en Procesamiento"
*   Si el SRI devuelve este error en la Fase de Recepción, el sistema lo interpreta como un éxito parcial.
*   **Acción Automática:** Salta directamente a la consulta de **Autorización** sin marcar error, permitiendo que el flujo termine exitosamente si el SRI logra procesarlo en segundos.

### 3.3. Validación de Consumidor Final
*   Si la identificación es `9999999999999`, el sistema fuerza automáticamente la Razón Social a `"CONSUMIDOR FINAL"`. Cualquier otro valor resultará en una factura `DEVUELTA` por el SRI.

### 3.4. Errores Tributarios (Ej: Secuencial Duplicado)
*   Si el SRI responde `NO AUTORIZADO` porque el secuencial ya existe de una factura de hace meses:
    *   **Medida:** Se debe mover la factura a un nuevo secuencial disponible.
    *   **Resultado:** Al cambiar el número de factura, la **Clave de Acceso cambiará automáticamente**, permitiendo un nuevo envío limpio.

---

## 4. Acciones Especiales y Reglas de Oro

1.  **Cambio de Fecha:** Si editas la fecha de una factura `DEVUELTA`, la Clave de Acceso **DEBE** cambiar, ya que la fecha es parte de los primeros 8 dígitos de la clave de 49 dígitos.
2.  **Anulación:** Solo facturas en estado `AUTORIZADA` pueden ser anuladas (proceso administrativo en el portal del SRI o vía Notas de Crédito según el caso).
3.  **Wait Time:** El sistema implementa una pausa obligatoria de 3 segundos entre Recepción y Autorización para respetar el procesamiento asíncrono del SRI.
4.  **Notificación:** Solo el estado `AUTORIZADA` dispara el envío automático del XML y RIDE por correo electrónico al cliente.

---

## 5. Glosario Técnico de Errores Comunes SRI

*   **Error 43:** Clave de acceso ya registrada (Se soluciona con nuestra lógica de idempotencia o consultando estado).
*   **Error 45:** Secuencial inválido (El número de factura ya fue usado anteriormente).
*   **Error 39:** Firma inválida (Verificar vigencia del certificado .p12).
*   **Error 56:** RUC del receptor no existe (Validar identificación del cliente).
