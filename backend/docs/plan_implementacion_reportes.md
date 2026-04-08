# Plan de Implementación: Módulo de Reportes de Ventas y Facturación (Backend)

Este plan detalla los pasos necesarios para implementar los reportes R-001 a R-005 en el backend, asegurando la agregación técnica, lógica de negocio y capacidades de exportación.

## 🛠 Fase 1: Repositorio (Agregación de Datos)

Actualizar `backend/src/modules/reportes/repository.py` con las siguientes consultas especializadas:

### Tarea 1.1: Consultas para R-001 (Ventas General)
- **Método**: `obtener_ventas_resumen`
- **Lógica**: Consulta que utilice `SUM(CASE ...)` para separar subtotales (base 0, base 15, exento), calcular IVA total (15%), descuentos y propinas.
- **Gráficos**: Métodos específicos para obtener ventas por establecimiento y por forma de pago (unión con tabla `formas_pago`).

### Tarea 1.2: Consultas para R-002 (Ventas Mensuales/Anuales)
- **Método**: `obtener_ventas_periodicas`
- **Lógica**: Uso de `DATE_TRUNC('month', ...)` filtrado por el año solicitado, devolviendo el conteo de facturas y totales por mes.

### Tarea 1.3: Consultas para R-003 (Rendimiento de Usuarios/Vendedores)
- **Método**: `obtener_ventas_por_usuario`
- **Lógica**: Join entre `facturas` y `usuarios`, agrupando por el nombre del usuario, calculando total ventas y promedio por ticket.

### Tarea 1.4: Consultas para R-004 y R-005 (Anuladas y Rechazadas)
- **Método**: `obtener_facturas_anuladas`: Reporte filtrado por `estado = 'ANULADA'`, extrayendo la razón y fecha de anulación.
- **Método**: `obtener_facturas_rechazadas_sri`: Join con la tabla de logs para extraer el mensaje de error exacto devuelto por el SRI.

---

## 🧠 Fase 2: Lógica de Servicio

Actualizar `backend/src/modules/reportes/service.py`:

### Tarea 2.1: Cálculos y Comparativas
- Implementar la lógica para comparar las ventas del periodo actual contra el anterior (ej: Este mes vs Mes anterior).
- Calcular los "Tickets Promedio" a nivel de servicio para mayor precisión.

### Tarea 2.2: Motor de Exportación Unificado
- Crear una utilidad para generar archivos a partir de los datos:
    - **PDF**: Usar las plantillas Jinja2 existentes + Playwright (PDF) para un diseño profesional (ya disponible en el proyecto).
    - **Excel**: Añadir la librería `openpyxl` para generar hojas de cálculo con formato de moneda y cabeceras estilizadas.

---

## 🛣 Fase 3: API y Schemas

### Tarea 3.1: Schemas (Pydantic)
- Definir modelos detallados en `schemas.py` que incluyan secciones para metadatos (filtros aplicados), datos tabulares y datos estructurados para gráficos (series de tiempo, tortas).

### Tarea 3.2: Endpoints (Router)
- Exponer rutas bajo el prefijo `/reportes/ventas/`:
    - `/general`, `/mensuales`, `/por-usuario`, `/anuladas`, `/rechazadas-sri`.
    - Parámetro opcional `format` (json, pdf, excel).

---

## 📈 Cronograma de Trabajo

| Día | Actividad Pesada | Entregable Técnico |
| :--- | :--- | :--- |
| **1** | Repositorio (SQL Queries) | Nuevos métodos en Repository |
| **2** | Lógica de Negocio | Cálculos de variación y ticket promedio |
| **3** | Plantillas y Exportación | Generador de PDF/Excel funcional |
| **4** | Endpoints y Schemas | API documentada y lista para QA |

> [!TIP]
> Dado que el proyecto ya usa **Playwright**, recomiendo usarlo para la generación de PDF desde HTML, ya que permite usar CSS moderno (Grid/Flexbox) para que los reportes se vean "Premium".
