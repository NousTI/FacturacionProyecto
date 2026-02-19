# Plan de Implementación: Cumplimiento Normativo SRI Ecuador

Este documento detalla los pasos necesarios para asegurar que el sistema de facturación cumpla al 100% con los estándares técnicos y legales exigidos por el SRI (Ecuador).

## 📋 Checklist de Cumplimiento

- [x] **Punto 1: Clave de Acceso (Módulo 11)**
  - [x] Implementar algoritmo de cálculo de dígito verificador.
  - [x] Reemplazar el código fijo por generación dinámica de clave de acceso.
- [ ] **Punto 2: Notas de Crédito (Tipo 04)**
  - [ ] Extender el `xml_service.py` para soportar esquema de Nota de Crédito.
  - [ ] Implementar lógica de vinculación de NC a Factura original.
- [x] **Punto 3: Precisión Decimal y Redondeos**
  - [x] Revisar sumatorias en `xml_service.py` para evitar errores de 1 centavo.
  - [x] Sincronizar lógica de redondeo entre Backend (Python Decimal) y XML.
- [ ] **Punto 4: Leyendas Rimpe y Tributarias**
  - [ ] Agregar campos `regimen_tributario` y `agente_retencion_nro` a la tabla `empresas`.
  - [ ] Incluir leyendas dinámicas en la sección `infoTributaria` del XML.
- [ ] **Punto 5: Integridad del RIDE (PDF)**
  - [ ] Asegurar que el generador de PDF use exclusivamente los datos del `snapshot_factura`.
- [ ] **Punto 6: Impuesto a Consumos Especiales (ICE)**
  - [ ] Agregar soporte para códigos de impuesto ICE en el detalle de productos.

---

## 🛠️ Detalle del Plan de Acción

### 1. Algoritmo Módulo 11 (Clave de Acceso)
La clave de acceso de 49 dígitos debe terminar en un dígito calculado.
*   **Archivos a tocar:** `backend/src/modules/sri/xml_service.py` o un helper de utilidad.
*   **Acción:** Crear función `calcular_modulo11(cadena_48_digitos)` que aplique el peso ascedente (2 a 7) de derecha a izquierda.

### 2. Soporte para Notas de Crédito
Legalmente, una factura autorizada requiere una Nota de Crédito para ser reversada.
*   **Archivos a tocar:** `backend/src/modules/facturas/schemas.py`, `backend/src/modules/sri/xml_service.py`.
*   **Acción:** Crear el método `generar_xml_nota_credito` que incluya el motivo de modificación y el número de la factura afectada.

### 3. Sincronización de Redondeos
Evitar que el SRI devuelva "Error de cálculo de impuestos".
*   **Acción:** Utilizar la clase `Decimal` de Python con `quantize(Decimal('0.00'), rounding=ROUND_HALF_UP)` en todos los cálculos antes de inyectarlos al XML. No realizar redondeos manuales con `round()`.

### 4. Régimenes Tributarios (RIMPE)
El SRI exige leyendas específicas según el tipo de contribuyente.
*   **Acción:** 
    *   Si es RIMPE Emprendedor: "Contribuyente Régimen RIMPE".
    *   Si es RIMPE Negocio Popular: "Contribuyente Negocio Popular - Régimen RIMPE".
    *   Si es Agente de Retención: "Agente de Retención Resolución No. [NRO]".
*   Inyectar estos textos en la etiqueta `<contribuyenteRimpe>` y `<informacionAdicional>` del XML.

### 5. RIDE basado en Snapshots
Garantizar la inmutabilidad de la factura impresa.
*   **Acción:** Modificar el servicio de generación de PDF para que reciba el objeto `FacturaLectura` completo (con sus campos `snapshot_`) en lugar de consultar las tablas de Clientes o Empresas por ID.

### 6. Estructura para ICE
Requerido para productos específicos.
*   **Acción:** Ampliar el esquema de detalles de factura para incluir `codigo_impuesto_ice`, `tarifa_ice` y `base_imponible_ice`.

---

## 🧪 Pruebas de Validación
1. **Ambiente de Pruebas:** Realizar todos los envíos al ambiente 1 del SRI.
2. **XSD Validation:** Validar los XML generados contra los esquemas `.xsd` oficiales del SRI antes de enviar.
3. **Casos de Borde:** Probar una factura de 0.01 centavos y una factura de gran volumen para verificar precisión decimal.
