# MANUAL DE USUARIO

## Sistema de Facturación Electrónica NousTI

---

## ÍNDICE DE CONTENIDOS

- [1. Introducción](#1-introducción)
- [2. Alcance del Sistema](#2-alcance-del-sistema)
- [3. Requisitos del Sistema](#3-requisitos-del-sistema)
  - [3.1. Requisitos de hardware](#31-requisitos-de-hardware)
  - [3.2. Requisitos de software](#32-requisitos-de-software)
- [4. Acceso al Sistema](#4-acceso-al-sistema)
  - [4.1. Pantalla de bienvenida](#41-pantalla-de-bienvenida)
  - [4.2. Inicio de sesión](#42-inicio-de-sesión)
    - [4.2.1. Elementos de la pantalla](#421-elementos-de-la-pantalla)
    - [4.2.2. Procedimiento de inicio de sesión](#422-procedimiento-de-inicio-de-sesión)
    - [4.2.3. Mensajes de error](#423-mensajes-de-error)
- [5. Funcionalidades del Sistema por Rol](#5-funcionalidades-del-sistema-por-rol)
  - [5.1. Uso del Sistema – Super Administrador](#51-uso-del-sistema--super-administrador)
    - [5.1.1. Panel de Control (Dashboard)](#511-panel-de-control-dashboard)
    - [5.1.2. Gestión de Empresas](#512-gestión-de-empresas)
    - [5.1.3. Gestión de Planes](#513-gestión-de-planes)
    - [5.1.4. Gestión de Vendedores](#514-gestión-de-vendedores)
    - [5.1.5. Gestión de Clientes](#515-gestión-de-clientes)
    - [5.1.6. Gestión de Suscripciones](#516-gestión-de-suscripciones)
    - [5.1.7. Gestión de Comisiones](#517-gestión-de-comisiones)
    - [5.1.8. Gestión de Renovaciones](#518-gestión-de-renovaciones)
    - [5.1.9. Certificados SRI](#519-certificados-sri)
    - [5.1.10. Reportes](#5110-reportes)
    - [5.1.11. Auditoría](#5111-auditoría)
  - [5.2. Uso del Sistema – Vendedor](#52-uso-del-sistema--vendedor)
    - [5.2.1. Pantalla de Cuenta Bloqueada](#521-pantalla-de-cuenta-bloqueada)
    - [5.2.2. Panel de Inicio (Dashboard)](#522-panel-de-inicio-dashboard)
    - [5.2.3. Gestión de Empresas](#523-gestión-de-empresas)
    - [5.2.4. Gestión de Clientes](#524-gestión-de-clientes)
    - [5.2.5. Seguimiento de Comisiones](#525-seguimiento-de-comisiones)
    - [5.2.6. Seguimiento de Suscripciones](#526-seguimiento-de-suscripciones)
    - [5.2.7. Catálogo de Planes](#527-catálogo-de-planes)
    - [5.2.8. Reportes](#528-reportes)
    - [5.2.9. Seguimiento de Renovaciones](#529-seguimiento-de-renovaciones)
    - [5.2.10. Mi Perfil](#5210-mi-perfil)
  - [5.3. Uso del Sistema – Administrador / Usuario de Empresa](#53-uso-del-sistema--administrador--usuario-de-empresa)
    - [5.3.1. Pantallas de Acceso Restringido](#531-pantallas-de-acceso-restringido)
    - [5.3.2. Panel de Control (Dashboard)](#532-panel-de-control-dashboard)
    - [5.3.3. Facturación Electrónica](#533-facturación-electrónica)
    - [5.3.4. Facturación Recurrente](#534-facturación-recurrente)
    - [5.3.5. Gestión de Clientes](#535-gestión-de-clientes)
    - [5.3.6. Catálogo de Productos](#536-catálogo-de-productos)
    - [5.3.7. Directorio de Proveedores](#537-directorio-de-proveedores)
    - [5.3.8. Gestión de Gastos](#538-gestión-de-gastos)
    - [5.3.9. Cuentas por Cobrar](#539-cuentas-por-cobrar)
    - [5.3.10. Configuración](#5310-configuración)
    - [5.3.11. Gestión de Roles y Permisos](#5311-gestión-de-roles-y-permisos)
    - [5.3.12. Gestión de Usuarios de la Empresa](#5312-gestión-de-usuarios-de-la-empresa)
    - [5.3.13. Reportes Financieros](#5313-reportes-financieros)
    - [5.3.14. Mi Perfil](#5314-mi-perfil)

---

## ÍNDICE DE FIGURAS

| N.°           | Descripción                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------- |
| **Figura 1**  | Pantalla de acceso al Sistema de Facturación Electrónica NousTI                                 |
| **Figura 2**  | Formulario de inicio de sesión con sus componentes principales                                  |
| **Figura 3**  | Campo de contraseña con función de mostrar/ocultar                                              |
| **Figura 4**  | Botón de inicio de sesión en estado de procesamiento                                            |
| **Figura 5**  | Notificación de bienvenida tras un inicio de sesión exitoso                                     |
| **Figura 6**  | Validación visual de campo con error (borde y fondo en rojo)                                    |
| **Figura 7**  | Notificación de error por credenciales incorrectas                                              |
| **Figura 8**  | Panel de Control general del Super Administrador                                                |
| **Figura 9**  | Tarjetas de indicadores clave (KPIs) del Panel de Control                                       |
| **Figura 10** | Vista principal del módulo de Gestión de Empresas                                               |
| **Figura 11** | Formulario de creación de nueva empresa                                                         |
| **Figura 12** | Panel de detalles de empresa — pestaña Plan & Uso                                               |
| **Figura 13** | Modal para cambiar el plan de suscripción de una empresa                                        |
| **Figura 14** | Vista principal del módulo de Gestión de Planes                                                 |
| **Figura 15** | Formulario de creación o edición de un plan de suscripción                                      |
| **Figura 16** | Vista principal del módulo de Gestión de Vendedores                                             |
| **Figura 17** | Formulario de creación o edición de vendedor                                                    |
| **Figura 18** | Modal de reasignación de empresas entre vendedores                                              |
| **Figura 19** | Vista principal del módulo de Gestión de Clientes                                               |
| **Figura 20** | Formulario de creación de nuevo cliente                                                         |
| **Figura 21** | Vista principal del módulo de Gestión de Suscripciones                                          |
| **Figura 22** | Modal de renovación o registro de pago de suscripción                                           |
| **Figura 23** | Vista principal del módulo de Gestión de Comisiones con filtros por estado                      |
| **Figura 24** | Modal para registrar el pago o aprobar una comisión                                             |
| **Figura 25** | Vista principal del módulo de Gestión de Renovaciones                                           |
| **Figura 26** | Modal para procesar una solicitud de renovación o cambio de plan                                |
| **Figura 27** | Vista principal del módulo de Certificados SRI                                                  |
| **Figura 28** | Modal de detalles de certificado digital SRI                                                    |
| **Figura 29** | Vista principal del módulo de Reportes con barra de filtros y tabs de informes                  |
| **Figura 30** | Vista principal del módulo de Auditoría del sistema                                             |
| **Figura 31** | Modal de detalle de un evento de auditoría                                                      |
| **Figura 32** | Pantalla de cuenta bloqueada del Vendedor                                                       |
| **Figura 33** | Panel de Inicio del Vendedor con KPIs, alertas y accesos rápidos                                |
| **Figura 34** | Tabla de empresas recientes en el Panel de Inicio                                               |
| **Figura 35** | Vista principal del módulo de Gestión de Empresas del Vendedor                                  |
| **Figura 36** | Formulario de registro de nueva empresa (vista del Vendedor)                                    |
| **Figura 37** | Modal de expediente de empresa — pestaña Plan & Uso                                             |
| **Figura 38** | Modal de cambio de plan de suscripción (vista del Vendedor)                                     |
| **Figura 39** | Vista principal del módulo de Clientes (vista del Vendedor)                                     |
| **Figura 40** | Modal de detalles de cliente (vista de solo lectura del Vendedor)                               |
| **Figura 41** | Vista principal del módulo de Comisiones del Vendedor                                           |
| **Figura 42** | Modal de detalles de una comisión (vista del Vendedor)                                          |
| **Figura 43** | Modal de historial de cambios de estado de una comisión                                         |
| **Figura 44** | Vista principal del módulo de Suscripciones del Vendedor                                        |
| **Figura 45** | Modal de historial general de suscripciones                                                     |
| **Figura 46** | Vista principal del módulo de Planes (vista del Vendedor)                                       |
| **Figura 47** | Vista principal del módulo de Reportes del Vendedor                                             |
| **Figura 48** | Vista principal del módulo de Renovaciones del Vendedor                                         |
| **Figura 49** | Formulario de creación de nueva solicitud de renovación                                         |
| **Figura 50** | Vista general del módulo Mi Perfil del Vendedor                                                 |
| **Figura 51** | Tarjeta de cambio de contraseña en Mi Perfil                                                    |
| **Figura 52** | Pantalla de acceso denegado para usuario desactivado                                            |
| **Figura 53** | Pantalla de sin permisos asignados                                                              |
| **Figura 54** | Panel de Control del Administrador / Usuario de Empresa                                         |
| **Figura 55** | Columna derecha del Panel de Control con estado del sistema, accesos rápidos y top de productos |
| **Figura 56** | Vista principal del módulo de Facturación Electrónica                                           |
| **Figura 57** | Sección de selección de cliente en el formulario de nueva factura                               |
| **Figura 58** | Tabla de detalle de productos en el formulario de factura                                       |
| **Figura 59** | Panel de observaciones y totales del formulario de factura                                      |
| **Figura 60** | Pantalla de espera durante el envío de la factura al SRI                                        |
| **Figura 61** | Modal de envío de factura por correo electrónico                                                |
| **Figura 62** | Modal de registro de pagos y abonos de factura                                                  |
| **Figura 63** | Modal de anulación de factura con campo de motivo obligatorio                                   |
| **Figura 64** | Vista principal del módulo de Facturación Recurrente                                            |
| **Figura 65** | Vista principal del módulo de Clientes — pestaña Directorio                                     |
| **Figura 66** | Formulario de creación o edición de cliente                                                     |
| **Figura 67** | Vista principal del módulo de Productos — pestaña Catálogo                                      |
| **Figura 68** | Formulario de creación o edición de producto                                                    |
| **Figura 69** | Vista principal del módulo de Proveedores                                                       |
| **Figura 70** | Vista principal del módulo de Gastos — pestaña Movimientos                                      |
| **Figura 71** | Formulario de registro de gasto                                                                 |
| **Figura 72** | Formulario de registro de pago de gasto                                                         |
| **Figura 73** | Vista principal del módulo de Cuentas por Cobrar                                                |
| **Figura 74** | Vista general del módulo de Configuración con el sidebar de secciones                           |
| **Figura 75** | Sección Empresa dentro del módulo de Configuración                                              |
| **Figura 76** | Sección de Datos SRI y certificado de firma electrónica                                         |
| **Figura 77** | Sección de gestión de Establecimientos                                                          |
| **Figura 78** | Sección de gestión de Puntos de Emisión                                                         |
| **Figura 79** | Vista principal del módulo de Roles y Permisos                                                  |
| **Figura 80** | Modal de asignación de permisos a un módulo dentro de un rol                                    |
| **Figura 81** | Vista principal del módulo de Gestión de Usuarios de Empresa                                    |
| **Figura 82** | Formulario de creación o edición de usuario de empresa                                          |
| **Figura 83** | Vista principal del módulo de Reportes con filtros y pestañas de informes                       |
| **Figura 84** | Vista general del módulo Mi Perfil del Usuario de Empresa                                       |

---

## 1. Introducción

NousTI es un sistema SaaS (Software como Servicio) de facturación electrónica diseñado para gestionar de forma centralizada la emisión de facturas, el control de clientes, productos, inventarios, pagos y reportes financieros. Al estar alojado en la nube, no requiere instalación local: el usuario accede desde cualquier navegador web con conexión a Internet.

El sistema está concebido para operar en múltiples empresas de forma simultánea, con una estructura de tres niveles de acceso que garantiza la separación de responsabilidades y la seguridad de la información de cada organización.

---

## 2. Alcance del Sistema

NousTI contempla tres perfiles de usuario, cada uno con un conjunto diferenciado de capacidades:

| Perfil                  | Código de rol       | Responsabilidades principales                                                                                                                                                                                                                                                                                     |
| ----------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Super Administrador** | `SUPERADMIN`        | Gestión global de la plataforma: creación y administración de empresas, asignación de planes de suscripción, gestión de vendedores y supervisión del estado de todas las organizaciones.                                                                                                                          |
| **Vendedor**            | `VENDEDOR`          | Gestión comercial: creación de empresas cliente, asignación y seguimiento de suscripciones, visualización de métricas de ventas.                                                                                                                                                                                  |
| **Usuario de Empresa**  | `USUARIO` / `ADMIN` | Operación del negocio: emisión de facturas, gestión de clientes, inventarios, pagos, gastos y consulta de reportes financieros. El rol `ADMIN` dentro de una empresa tiene acceso completo a todos los módulos; los roles con permisos restringidos solo visualizan los módulos habilitados por su administrador. |

> **Nota:** Un usuario de tipo `USUARIO` cuya cuenta esté marcada como inactiva por el administrador de su empresa no podrá ingresar al sistema y será redirigido a la pantalla de acceso denegado.

---

## 3. Requisitos del Sistema

Para utilizar NousTI no es necesario instalar ningún programa adicional. Los requisitos mínimos son:

### 3.1. Requisitos de hardware

| Componente             | Mínimo recomendado     |
| ---------------------- | ---------------------- |
| Procesador             | 1 GHz o superior       |
| Memoria RAM            | 2 GB                   |
| Resolución de pantalla | 1280 × 720 píxeles     |
| Conexión a Internet    | Banda ancha (≥ 5 Mbps) |

### 3.2. Requisitos de software

| Componente    | Requisito                                                                  |
| ------------- | -------------------------------------------------------------------------- |
| Navegador web | Google Chrome 110+, Mozilla Firefox 110+, Microsoft Edge 110+ o Safari 16+ |
| JavaScript    | Habilitado en el navegador                                                 |
| Cookies       | Habilitadas en el navegador                                                |

> **Importante:** Se recomienda mantener el navegador actualizado a su versión más reciente para garantizar compatibilidad y seguridad.

---

## 4. Acceso al Sistema

### 4.1. Pantalla de bienvenida

Al ingresar a la dirección web de NousTI en el navegador, el sistema detecta automáticamente si el usuario posee una sesión activa:

- **Sin sesión activa:** El sistema redirige de forma automática a la pantalla de inicio de sesión.
- **Con sesión activa:** El sistema redirige directamente al panel de control correspondiente al rol del usuario.

La pantalla de acceso presenta un diseño limpio y centrado sobre un fondo gris claro. En el centro de la pantalla se muestra una tarjeta blanca con el logotipo de la aplicación (**NousTI**) y el subtítulo _"Sistema de facturación."_

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista general de la página de acceso al sistema, mostrando la tarjeta central con el título "NousTI", el subtítulo y el formulario de inicio de sesión sobre fondo gris] -->

**Figura 1:** Pantalla de acceso al Sistema de Facturación Electrónica NousTI.

---

### 4.2. Inicio de sesión

El inicio de sesión permite autenticar la identidad del usuario y otorgarle acceso a los módulos correspondientes a su rol.

#### 4.2.1. Elementos de la pantalla

La tarjeta de inicio de sesión contiene los siguientes elementos (de arriba hacia abajo):

1. **Título de la aplicación** — Texto "NousTI" en tipografía grande y en negrita.
2. **Subtítulo** — Texto "Sistema de facturación." en color gris.
3. **Campo Correo electrónico** — Etiqueta en mayúsculas; campo de texto con texto de ayuda `nombre@ejemplo.com`.
4. **Campo Contraseña** — Etiqueta en mayúsculas; campo de contraseña con texto de ayuda `••••••••` y un botón con ícono de ojo (👁) en el borde derecho del campo.
5. **Botón "INICIAR SESIÓN"** — Botón redondeado de color primario azul, en mayúsculas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Tarjeta de inicio de sesión con los cinco elementos identificados: título NousTI, subtítulo, campo de correo, campo de contraseña con ícono de ojo, y botón INICIAR SESIÓN] -->

**Figura 2:** Formulario de inicio de sesión con sus componentes principales.

#### 4.2.2. Procedimiento de inicio de sesión

Siga los pasos descritos a continuación para acceder al sistema:

**Paso 1 — Ingresar el correo electrónico**
Haga clic sobre el campo _"Correo electrónico"_ y escriba la dirección de correo electrónico con la que fue registrado en el sistema (por ejemplo: `usuario@empresa.com`).

**Paso 2 — Ingresar la contraseña**
Haga clic sobre el campo _"Contraseña"_ e ingrese su clave de acceso.

- Para visualizar los caracteres de la contraseña mientras la escribe, haga clic en el ícono de ojo (👁) ubicado en el extremo derecho del campo. El ícono cambiará a ojo tachado indicando que la contraseña es visible.
- Para ocultar nuevamente la contraseña, haga clic en el mismo ícono.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Campo de contraseña con el ícono de ojo en el borde derecho, mostrando el estado "contraseña oculta" (puntos) y el estado "contraseña visible" (texto en claro)] -->

**Figura 3:** Campo de contraseña con función de mostrar/ocultar.

**Paso 3 — Hacer clic en "INICIAR SESIÓN"**
Una vez completados ambos campos, haga clic en el botón **INICIAR SESIÓN**.

- El botón se desactivará temporalmente y mostrará el texto **"PROCESANDO..."** junto a un indicador de carga giratorio mientras el sistema verifica sus credenciales.
- No cierre ni recargue la página durante este proceso.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Botón "INICIAR SESIÓN" en estado de carga, mostrando el spinner giratorio y el texto "PROCESANDO..."] -->

**Figura 4:** Botón de inicio de sesión en estado de procesamiento.

**Paso 4 — Acceso concedido**
Si las credenciales son correctas, el sistema mostrará una notificación emergente verde con el mensaje **"¡Bienvenido!"** en la esquina superior derecha de la pantalla y lo redirigirá automáticamente al panel de control según su rol:

| Rol                 | Destino tras el inicio de sesión                                  |
| ------------------- | ----------------------------------------------------------------- |
| Super Administrador | Panel principal del Super Administrador                           |
| Vendedor            | Panel principal del Vendedor                                      |
| Usuario de Empresa  | Primer módulo habilitado por permisos, o pantalla de sin permisos |

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Notificación toast verde con el mensaje "¡Bienvenido!" en la esquina superior derecha de la pantalla, tras iniciar sesión correctamente] -->

**Figura 5:** Notificación de bienvenida tras un inicio de sesión exitoso.

#### 4.2.3. Mensajes de error

Si los datos ingresados son incorrectos o incompletos, el sistema informa al usuario mediante los siguientes mecanismos:

**a) Validación de campos vacíos**
Si intenta hacer clic en _INICIAR SESIÓN_ sin completar uno o ambos campos, el sistema resaltará el campo vacío con un borde de color rojo y un fondo rosado. El botón permanecerá desactivado hasta que todos los campos tengan contenido válido.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Formulario con el campo "Correo electrónico" resaltado en rojo por estar vacío o contener un formato incorrecto] -->

**Figura 6:** Validación visual de campo con error (borde y fondo en rojo).

**b) Validación de formato de correo**
Si el texto ingresado en el campo de correo no corresponde a un formato de dirección de correo electrónico válido (por ejemplo, si falta el símbolo `@`), el campo se marcará en rojo antes de enviar el formulario.

**c) Credenciales incorrectas**
Si el correo o la contraseña no coinciden con ningún usuario registrado, el sistema mostrará una notificación emergente roja con el mensaje de error correspondiente en la esquina superior derecha de la pantalla.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Notificación toast roja con mensaje de error de credenciales inválidas en la esquina superior derecha de la pantalla] -->

**Figura 7:** Notificación de error por credenciales incorrectas.

> **Nota de seguridad:** Por razones de seguridad, el sistema no especifica si el error se debe al correo electrónico o a la contraseña. En caso de no recordar su contraseña, contacte al administrador de su empresa o al soporte técnico de NousTI.

---

## 5. Funcionalidades del Sistema por Rol

### 5.1. Uso del Sistema – Super Administrador

El Super Administrador es el perfil con mayor nivel de acceso en NousTI. Desde su panel de control gestiona la totalidad de la plataforma: empresas, planes, vendedores, suscripciones, comisiones, certificados tributarios, reportes globales y el registro de auditoría del sistema. Al iniciar sesión, el sistema lo redirige automáticamente a su panel principal.

---

#### 5.1.1. Panel de Control (Dashboard)

El Panel de Control es la pantalla de inicio del Super Administrador. Presenta una visión consolidada del estado de la plataforma mediante indicadores clave, gráficos y accesos directos.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista completa del Panel de Control del Super Administrador, mostrando las tarjetas de KPIs en la parte superior, la sección de gráficos de ingresos, la tabla de empresas recientes y el bloque de alertas del sistema] -->

**Figura 8:** Panel de Control general del Super Administrador.

**Tarjetas de indicadores (KPIs)**

En la parte superior de la pantalla se muestran tarjetas con los principales indicadores del sistema:

- **Ingresos totales** — Suma de los pagos registrados en el período.
- **Empresas activas** — Total de empresas con suscripción vigente.
- **Usuarios** — Total de usuarios registrados en todas las empresas.
- **Certificados por vencer** — Cantidad de certificados SRI próximos a expirar.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Fila de tarjetas de KPIs del dashboard mostrando: Ingresos, Empresas Activas, Usuarios y Certificados por Vencer, cada una con su icono y valor numérico] -->

**Figura 9:** Tarjetas de indicadores clave (KPIs) del Panel de Control.

**Selector de período**

Encima de los gráficos de ingresos se encuentra un selector con tres opciones: **Día**, **Mes** y **Año**. Al hacer clic en cualquiera de ellas, los gráficos de tendencia se actualizan automáticamente para mostrar los datos del período seleccionado.

**Empresas recientes**

En la parte inferior del panel se presenta una tabla con las últimas empresas registradas, que incluye: nombre, plan activo, fecha de registro y estado. Esta tabla es de solo lectura; para gestionar una empresa en detalle, diríjase al módulo **Empresas** desde el menú lateral.

**Alertas del sistema**

El panel muestra un bloque de alertas destacadas en color rojo o amarillo cuando existen situaciones críticas, por ejemplo: certificados SRI próximos a vencer, pagos atrasados o empresas sin plan asignado.

---

#### 5.1.2. Gestión de Empresas

El módulo **Empresas** permite crear, consultar, editar y administrar todas las organizaciones registradas en la plataforma.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Módulo de Empresas mostrando la barra de estadísticas (Total, Activas, Inactivas) en la parte superior, la barra de búsqueda con filtros y la tabla de empresas con sus columnas y menú de acciones desplegado en una fila] -->

**Figura 10:** Vista principal del módulo de Gestión de Empresas.

**Barra de estadísticas**

En la parte superior se muestran tres tarjetas: **Total de empresas**, **Empresas activas** e **Empresas inactivas**. Estos valores se actualizan automáticamente al aplicar filtros.

**Búsqueda y filtros**

- Ingrese un término en el campo de búsqueda (nombre o RUC) para filtrar la lista en tiempo real.
- Utilice los filtros de estado para mostrar solo empresas activas, inactivas o todas.

**Tabla de empresas**

La tabla presenta las siguientes columnas:

| Columna         | Contenido                                                         |
| --------------- | ----------------------------------------------------------------- |
| **Nombre**      | Razón social, número de RUC y avatar de la empresa                |
| **Estado**      | Etiqueta de color: verde (ACTIVO) o rojo (INACTIVO)               |
| **Plan Actual** | Nombre del plan, tipo de persona y régimen tributario             |
| **Vendedor**    | Nombre del vendedor asignado, o "Directa" si no tiene             |
| **Usuarios**    | Barra de progreso con el consumo actual sobre el máximo permitido |
| **Inicio**      | Fecha de inicio de la suscripción vigente                         |
| **Vencimiento** | Fecha de vencimiento; se muestra en rojo si ya venció             |
| **Acciones**    | Menú desplegable con las acciones disponibles                     |

**Paginación**

Debajo de la tabla se encuentran los controles de paginación: botones de primera, anterior, siguiente y última página, junto con un selector del número de filas por página (10, 25, 50 o 100).

##### Crear una nueva empresa

1. Haga clic en el botón **"Nueva Empresa"** (azul, esquina superior derecha del módulo).
2. Se abrirá un formulario dividido en tres secciones.

**Sección "Información Legal":**

- **Razón Social** — Nombre legal completo de la empresa.
- **Nombre Comercial** — Nombre con el que opera la empresa.
- **RUC** — Número de Registro Único de Contribuyentes.
- **Tipo de Persona** — Natural o Jurídica.
- **Régimen Tributario** — RIMPE, General, u otro según corresponda.
- **Dirección Principal** — Dirección física de la empresa (mínimo 5 caracteres).

**Sección "Información de Contacto":**

- **Email** — Dirección de correo electrónico de contacto.
- **Teléfono** — Número de teléfono en formato `09XXXXXXXX`.

**Sección "Configuración":**

- **Vendedor Asignado** — Seleccione un vendedor de la lista desplegable o déjelo vacío para asignación directa.
- **Obligado a llevar contabilidad** — Interruptor de activación/desactivación.

**Sección "Suscripción y Pago Inicial"** (solo al crear):

- **Plan de Suscripción** — Seleccione el plan de la lista. El sistema calcula automáticamente el monto.
- **Monto Pago Inicial** — Se completa automáticamente según el plan elegido (solo lectura).
- **Estado de Pago** — PAGADO o PENDIENTE.
- **Método de Pago** — Transferencia, Efectivo, Tarjeta u Otro.
- **Número de Comprobante** — Obligatorio si el estado es PAGADO.
- **Observación** — Campo libre para notas adicionales.

3. Complete todos los campos obligatorios (marcados con asterisco).
4. Haga clic en **"Guardar"** para registrar la empresa, o en **"Cancelar"** para descartar.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación de empresa con las cuatro secciones visibles: Información Legal, Información de Contacto, Configuración y Suscripción y Pago Inicial, con algunos campos completados de ejemplo] -->

**Figura 11:** Formulario de creación de nueva empresa.

##### Ver detalles de una empresa

1. En la fila de la empresa, haga clic en el ícono de acciones (tres puntos o flecha) y seleccione **"Ver Detalles"**.
2. Se abrirá un panel de detalles con tres pestañas:

- **General:** Razón social, RUC, nombre comercial, email, teléfono, vendedor asignado y dirección.
- **Plan & Uso:** Estado del plan, fecha de vencimiento, último pago registrado y tres barras de progreso que muestran el consumo de usuarios, establecimientos y facturas mensuales en relación con los límites del plan.
- **SRI & Facturación:** Estado del certificado digital, fecha de expiración, ambiente de emisión (Producción o Pruebas) y si la empresa está obligada a llevar contabilidad.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de detalles de empresa con las tres pestañas (General, Plan & Uso, SRI & Facturación) visibles, mostrando la pestaña "Plan & Uso" activa con las barras de progreso de consumo] -->

**Figura 12:** Panel de detalles de empresa — pestaña Plan & Uso.

##### Editar una empresa

1. En el menú de acciones de la fila, seleccione **"Editar Datos"**.
2. Se abre el mismo formulario de creación con los datos actuales precargados.
3. Modifique los campos necesarios y haga clic en **"Guardar"**.

> **Nota:** El campo RUC no es editable una vez que la empresa ha sido creada.

##### Cambiar el plan de suscripción

1. En el menú de acciones, seleccione **"Cambiar Plan"**.
2. En el modal que aparece, seleccione el nuevo plan en el listado desplegable. El monto se recalcula automáticamente.
3. Indique el estado del pago, el método y el número de comprobante si corresponde.
4. Agregue observaciones si lo requiere y haga clic en **"Confirmar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de cambio de plan mostrando el selector de nuevo plan, el monto calculado automáticamente, los campos de estado de pago y método, y el botón Confirmar] -->

**Figura 13:** Modal para cambiar el plan de suscripción de una empresa.

##### Asignar o cambiar vendedor

1. En el menú de acciones, seleccione **"Asignar Vendedor"**.
2. Elija el vendedor deseado en la lista desplegable.
3. Haga clic en **"Guardar"**.

##### Activar o desactivar una empresa

En el menú de acciones, seleccione **"Activar"** o **"Desactivar"** según corresponda. El sistema solicitará confirmación antes de aplicar el cambio. Una empresa desactivada no podrá ser utilizada por sus usuarios hasta que sea reactivada.

##### Acceso de soporte

La opción **"Acceso de Soporte"** permite al Super Administrador ingresar temporalmente al entorno de la empresa para brindar asistencia técnica. El sistema pedirá confirmación antes de realizar el cambio de contexto.

---

#### 5.1.3. Gestión de Planes

El módulo **Planes** permite definir los diferentes niveles de servicio que se ofrecen a las empresas: sus precios, límites de uso y características incluidas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Planes mostrando la barra de estadísticas, la tabla de planes con columnas Nombre, Costo, Empresas, Visible en Web, Estado y Acciones, con al menos tres planes de ejemplo] -->

**Figura 14:** Vista principal del módulo de Gestión de Planes.

**Tabla de planes**

| Columna      | Contenido                                                              |
| ------------ | ---------------------------------------------------------------------- |
| **Nombre**   | Nombre del plan y descripción breve                                    |
| **Costo**    | Precio anual en dólares                                                |
| **Empresas** | Número de empresas actualmente suscritas a este plan (enlace clicable) |
| **Público**  | Indica si el plan es visible en el sitio web: VISIBLE u OCULTO         |
| **Estado**   | ACTIVO o INACTIVO                                                      |
| **Acciones** | Menú con opciones de gestión                                           |

##### Crear un nuevo plan

1. Haga clic en **"Nuevo Plan"**.
2. Complete el formulario con las siguientes secciones:

**Información Básica:**

- **Nombre del Plan** — Denominación comercial.
- **Descripción** — Texto descriptivo del plan.
- **Precio ($)** — Tarifa anual.

**Límites y Capacidades:**

- **Usuarios Máximos** — Cantidad máxima de cuentas de usuario.
- **Facturas por Mes** — Límite de documentos electrónicos mensuales.
- **Establecimientos** — Número máximo de establecimientos autorizados.
- **Programaciones** — Número máximo de tareas programadas.

**Características Premium** (casillas de verificación):

| Característica          | Descripción                                  |
| ----------------------- | -------------------------------------------- |
| API Acceso              | Permite conexión vía API externa             |
| Multi-usuario           | Habilita gestión de múltiples usuarios       |
| Respaldo Automático     | Copias de seguridad automáticas              |
| Exportación de Datos    | Descarga de información en formatos externos |
| Reportes Avanzados      | Acceso a reportes detallados                 |
| Alertas de Vencimiento  | Notificaciones automáticas de fechas límite  |
| Personalización de PDF  | Personalización de documentos emitidos       |
| Soporte Prioritario     | Atención preferencial                        |
| Facturación Electrónica | Emisión de comprobantes electrónicos SRI     |

3. Marque las características que incluye el plan.
4. Haga clic en **"Guardar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación de plan con las tres secciones: Información Básica con campos de nombre, descripción y precio; Límites y Capacidades con campos numéricos; y la grilla de Características Premium con casillas de verificación] -->

**Figura 15:** Formulario de creación o edición de un plan de suscripción.

##### Ver empresas suscritas a un plan

En la columna **"Empresas"** de la tabla, haga clic en el número. Se abrirá un modal con la lista de empresas que utilizan ese plan, mostrando nombre, estado y fecha de suscripción.

##### Ocultar o mostrar un plan en el sitio web

En el menú de acciones, seleccione **"Ocultar de Web"** o **"Mostrar en Web"**. Esta opción controla si el plan aparece disponible para los visitantes del sitio, sin afectar a las empresas ya suscritas.

##### Activar o desactivar un plan

Seleccione **"Desactivar"** o **"Activar"** desde el menú de acciones. Un plan desactivado no puede asignarse a nuevas empresas, pero las suscritas existentes no se ven afectadas.

---

#### 5.1.4. Gestión de Vendedores

El módulo **Vendedores** permite registrar y administrar a los agentes comerciales responsables de captar y gestionar empresas cliente.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Vendedores mostrando las tarjetas de estadísticas (Total, Activos, Inactivos, Empresas, Ingresos), los tabs de filtro por estado y la tabla de vendedores con sus columnas] -->

**Figura 16:** Vista principal del módulo de Gestión de Vendedores.

**Tabs de filtro**

En la parte superior de la tabla se presentan tres pestañas: **Todos**, **Activos** e **Inactivos**. Haga clic en cualquiera para filtrar la lista instantáneamente.

**Tabla de vendedores**

| Columna      | Contenido                                  |
| ------------ | ------------------------------------------ |
| **Vendedor** | Nombre completo y avatar con iniciales     |
| **Email**    | Correo electrónico de contacto             |
| **Cédula**   | Tipo y número de identificación            |
| **Empresas** | Cantidad de empresas asignadas actualmente |
| **Estado**   | ACTIVO o INACTIVO                          |
| **Acciones** | Menú de gestión                            |

##### Crear un nuevo vendedor

1. Haga clic en **"Nuevo Vendedor"**.
2. Complete el formulario:

**Datos Personales:**

- **Nombres** y **Apellidos**.
- **Tipo de Identificación** — Cédula u otro.
- **Identificación** — Número de cédula o pasaporte.
- **Email** — Correo de acceso al sistema.
- **Teléfono** — Número de contacto.

**Configuración de Comisiones:**

- **Tipo de Comisión** — Por porcentaje.
- **% Comisión Inicial** — Porcentaje sobre la primera venta.
- **% Comisión Recurrente** — Porcentaje sobre renovaciones.

**Permisos del Vendedor** (casillas de verificación):

- **Puede Crear Empresas** — Permite al vendedor registrar nuevas empresas.
- **Puede Gestionar Planes** — Permite visualizar y gestionar planes.
- **Puede Acceder a Empresas** — Permite ingresar al entorno de sus empresas.
- **Puede Ver Reportes** — Permite acceder a los reportes de ventas.

3. Haga clic en **"Guardar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación de vendedor con las secciones de Datos Personales, Configuración de Comisiones y la grilla de Permisos con casillas de verificación] -->

**Figura 17:** Formulario de creación o edición de vendedor.

##### Ver detalles de un vendedor

En el menú de acciones, seleccione **"Ver Detalles"**. El modal muestra:

- Información personal completa.
- Configuración de comisiones y permisos.
- Estadísticas: total de empresas gestionadas, ingresos generados y comisiones acumuladas.
- Tabla de empresas asignadas con nombre, estado y fecha de asignación.

##### Reasignar empresas de un vendedor

1. En el menú de acciones, seleccione **"Reasignar Empresas"**.
2. En el modal que aparece, se muestra la lista de empresas actualmente asignadas al vendedor, con casillas de selección.
3. Marque las empresas que desea transferir.
4. Seleccione el **vendedor de destino** en la lista desplegable.
5. Haga clic en **"Confirmar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de reasignación de empresas mostrando la lista de empresas con casillas de selección, el selector de vendedor destino y el botón Confirmar] -->

**Figura 18:** Modal de reasignación de empresas entre vendedores.

##### Activar, desactivar o eliminar un vendedor

- **Bloquear/Activar:** En el menú de acciones, seleccione la opción correspondiente. El sistema pedirá confirmación. Un vendedor bloqueado no puede ingresar al sistema.
- **Eliminar:** Seleccione **"Eliminar"** (se resalta en rojo). Esta acción es irreversible y requiere confirmación explícita.

---

#### 5.1.5. Gestión de Clientes

El módulo **Clientes** administra las cuentas de usuarios finales que operan dentro de las empresas registradas en la plataforma.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Clientes mostrando las tarjetas de estadísticas (Total, Activos, Nuevos este mes), la barra de búsqueda y la tabla de clientes con columnas Cliente, Contacto, Empresa, Origen, Rol, Estado y Acciones] -->

**Figura 19:** Vista principal del módulo de Gestión de Clientes.

**Tabla de clientes**

| Columna      | Contenido                                                  |
| ------------ | ---------------------------------------------------------- |
| **Cliente**  | Nombre completo y avatar con iniciales                     |
| **Contacto** | Email y teléfono                                           |
| **Empresa**  | Nombre de la empresa a la que pertenece                    |
| **Origen**   | Cómo fue creado el usuario: Superadmin, Vendedor o Sistema |
| **Rol**      | Admin o Usuario                                            |
| **Estado**   | ACTIVO o INACTIVO                                          |
| **Acciones** | Menú de gestión                                            |

##### Crear un nuevo cliente

1. Haga clic en **"Nuevo Cliente"**.
2. Complete el formulario:
   - **Nombres** y **Apellidos** (mínimo 3 caracteres cada uno).
   - **Teléfono** en formato `09XXXXXXXX`.
   - **Email** — Se genera automáticamente (campo de solo lectura).
   - **Empresa Asignada** — Seleccione la empresa del listado.
3. Haga clic en **"Guardar"**.

> **Nota:** El cliente se crea con rol **Admin** por defecto y con la contraseña inicial `password`. Se recomienda indicar al usuario que la cambie en su primer acceso.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación de cliente con los campos Nombres, Apellidos, Teléfono, Email (generado automáticamente, en gris) y el selector de Empresa Asignada] -->

**Figura 20:** Formulario de creación de nuevo cliente.

##### Ver detalles y trazabilidad de un cliente

En el menú de acciones, seleccione **"Ver Detalles"**. El modal muestra dos pestañas:

- **Trazabilidad:** Línea de tiempo que muestra quién creó la cuenta (Super Admin, Vendedor o sistema), la empresa de origen y los datos del usuario final.
- **Datos:** Email, teléfono, fecha de registro e identificador interno del sistema.

##### Reasignar a otra empresa

1. En el menú de acciones, seleccione **"Reasignar Empresa"**.
2. Elija la nueva empresa en el selector.
3. Haga clic en **"Confirmar"**.

##### Activar, desactivar o eliminar un cliente

- **Desactivar/Activar:** Seleccione la opción del menú de acciones. El sistema pedirá confirmación. Un cliente inactivo no puede iniciar sesión.
- **Eliminar:** Seleccione **"Eliminar"** (resaltado en rojo). Requiere confirmación explícita y es irreversible.

---

#### 5.1.6. Gestión de Suscripciones

El módulo **Suscripciones** centraliza el control de todos los contratos de servicio activos, sus estados de pago y las acciones de renovación o suspensión.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Suscripciones con las tarjetas de estadísticas (Activas, Vencidas, Ingresos Proyectados), los filtros de estado de suscripción y pago, y la tabla con sus columnas incluyendo las etiquetas de color de estado] -->

**Figura 21:** Vista principal del módulo de Gestión de Suscripciones.

**Filtros disponibles**

- **Búsqueda** por nombre de empresa o plan.
- **Estado de Suscripción:** Todas, Activa, Suspendida, Cancelada, Vencida.
- **Estado de Pago:** Todos, Pagado, Pendiente, Atrasado.
- **Botón "Mantenimiento":** Ejecuta una rutina automática que actualiza los estados de suscripción según las fechas de vencimiento registradas.

**Tabla de suscripciones**

| Columna           | Contenido                                                                   |
| ----------------- | --------------------------------------------------------------------------- |
| **Empresa**       | Nombre de la empresa                                                        |
| **Plan / Precio** | Nombre del plan y tarifa anual                                              |
| **Inicio**        | Fecha de inicio de la suscripción                                           |
| **Vencimiento**   | Fecha de vencimiento; aparece en rojo con la leyenda "VENCIDO" si ya expiró |
| **Pago**          | PAGADO (verde), PENDIENTE (amarillo) o ATRASADO (rojo)                      |
| **Estado**        | ACTIVA, VENCIDA, SUSPENDIDA o CANCELADA                                     |
| **Acciones**      | Menú con las acciones habilitadas según el estado                           |

**Acciones disponibles según estado:**

| Estado               | Acciones disponibles                    |
| -------------------- | --------------------------------------- |
| PENDIENTE / ATRASADO | Confirmar Cobro                         |
| ACTIVA / PAGADO      | Renovar / Extender, Suspender, Cancelar |
| SUSPENDIDA           | Activar, Cancelar                       |

##### Confirmar cobro de una suscripción pendiente

1. En el menú de acciones de una suscripción con pago PENDIENTE o ATRASADO, seleccione **"Confirmar Cobro"**.
2. En el modal, agregue una observación si lo requiere.
3. Haga clic en **"Confirmar"**.

##### Renovar o extender una suscripción

1. En el menú de acciones de una suscripción PAGADA, seleccione **"Renovar / Extender"**.
2. Complete el formulario de renovación:
   - **Fecha de Inicio** del nuevo período.
   - **Fecha de Fin** del nuevo período.
   - **Estado de Pago**, **Método de Pago** y **Número de Comprobante** (si aplica).
   - **Observación** libre.
3. Haga clic en **"Guardar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de registro de pago / renovación de suscripción con los campos de fechas, estado de pago, método de pago, número de comprobante y observación] -->

**Figura 22:** Modal de renovación o registro de pago de suscripción.

##### Suspender o cancelar una suscripción

- **Suspender:** En el menú de acciones, seleccione **"Suspender"**. El sistema pedirá confirmación. La empresa suspendida no podrá emitir documentos hasta que la suscripción sea reactivada.
- **Cancelar:** Seleccione **"Cancelar"**. Esta acción requiere confirmación y marca la suscripción como cancelada de forma permanente.

---

#### 5.1.7. Gestión de Comisiones

El módulo **Comisiones** administra el ciclo de vida de las comisiones generadas para los vendedores: desde su creación automática hasta la aprobación y registro del pago.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Comisiones mostrando los tabs de filtro por estado (Todas, Por Aprobar, Por Pagar, Historial Pagos, Rechazadas) y la tabla con columnas Vendedor, Concepto, Monto, Generado, Estado y Acciones, con etiquetas de color según estado] -->

**Figura 23:** Vista principal del módulo de Gestión de Comisiones con filtros por estado.

**Tabs de estado**

La tabla se filtra mediante cinco pestañas ubicadas en la parte superior:

| Pestaña             | Muestra                                               |
| ------------------- | ----------------------------------------------------- |
| **Todas Generadas** | Todas las comisiones sin importar su estado           |
| **Por Aprobar**     | Comisiones en estado PENDIENTE que requieren revisión |
| **Por Pagar**       | Comisiones ya aprobadas pendientes de pago            |
| **Historial Pagos** | Comisiones en estado PAGADA                           |
| **Rechazadas**      | Comisiones en estado RECHAZADA                        |

**Tabla de comisiones**

| Columna      | Contenido                                |
| ------------ | ---------------------------------------- |
| **Vendedor** | Nombre del vendedor y avatar             |
| **Concepto** | Descripción del motivo de la comisión    |
| **Monto**    | Valor en dólares                         |
| **Generado** | Fecha en que se generó la comisión       |
| **Estado**   | Etiqueta de color según estado           |
| **Acciones** | Menú con opciones según el estado actual |

**Acciones disponibles según estado:**

| Estado    | Acciones disponibles                       |
| --------- | ------------------------------------------ |
| PENDIENTE | Auditoría, Aprobar, Rechazar, Ver Detalles |
| APROBADA  | Auditoría, Registrar Pago, Ver Detalles    |
| PAGADA    | Auditoría, Ver Detalles                    |
| RECHAZADA | Auditoría, Ver Detalles                    |

##### Aprobar una comisión

1. En la pestaña **"Por Aprobar"**, localice la comisión.
2. En el menú de acciones, seleccione **"Aprobar"**.
3. En el modal, ingrese una observación opcional y haga clic en **"Confirmar"**.

##### Rechazar una comisión

1. En el menú de acciones de una comisión PENDIENTE, seleccione **"Rechazar"**.
2. Ingrese el motivo del rechazo en el campo de observaciones.
3. Haga clic en **"Confirmar Rechazo"**.

##### Registrar el pago de una comisión

1. En la pestaña **"Por Pagar"**, localice la comisión aprobada.
2. En el menú de acciones, seleccione **"Registrar Pago"**.
3. Complete el modal:
   - **Método de Pago** — Transferencia, Efectivo, Tarjeta u Otro.
   - **Observaciones** — Número de transacción u otra referencia.
4. Haga clic en **"Confirmar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de acción de comisión (Aprobar / Registrar Pago) mostrando el campo de método de pago, el campo de observaciones y los botones de acción] -->

**Figura 24:** Modal para registrar el pago o aprobar una comisión.

##### Consultar el historial de auditoría de una comisión

En el menú de acciones de cualquier comisión, seleccione **"Auditoría"**. Se abre un modal con la línea de tiempo completa de cambios: fecha, usuario que realizó la acción, estado anterior y nuevo, y observaciones.

---

#### 5.1.8. Gestión de Renovaciones

El módulo **Renovaciones** gestiona las solicitudes de cambio de plan enviadas desde las empresas: renovaciones del mismo plan, upgrades a planes superiores y downgrades a planes inferiores.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Renovaciones mostrando los filtros de estado y tipo, y la tabla con columnas Empresa, Plan Actual / Plan Nuevo, Tipo (badge de color), Solicitado, Estado y Acciones] -->

**Figura 25:** Vista principal del módulo de Gestión de Renovaciones.

**Filtros disponibles**

- **Búsqueda** por empresa, plan o tipo.
- **Estado:** PENDIENTE, ACEPTADA o RECHAZADA.
- **Tipo de Solicitud:** RENOVACIÓN, UPGRADE o DOWNGRADE.

**Tabla de solicitudes**

| Columna                      | Contenido                                          |
| ---------------------------- | -------------------------------------------------- |
| **Empresa**                  | Nombre de la empresa solicitante                   |
| **Plan Actual / Plan Nuevo** | Nombre del plan vigente y del plan solicitado      |
| **Tipo**                     | Etiqueta de color: RENOVACION, UPGRADE o DOWNGRADE |
| **Solicitado**               | Fecha en que se realizó la solicitud               |
| **Estado**                   | PENDIENTE, ACEPTADA o RECHAZADA                    |
| **Acciones**                 | Menú con opciones según estado                     |

##### Procesar una solicitud de renovación

1. En la tabla, localice la solicitud con estado **PENDIENTE**.
2. En el menú de acciones, seleccione **"Procesar"**.
3. En el modal de procesamiento:
   - Revise el resumen de la solicitud (empresa, plan actual, plan nuevo y monto a cobrar).
   - Seleccione el **Estado de Pago** (PAGADO o PENDIENTE).
   - Si el pago está confirmado, seleccione el **Método de Pago** e ingrese el **Número de Comprobante**.
4. Haga clic en **"Confirmar Aceptación"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de procesamiento de renovación mostrando el resumen con empresa, plan actual, plan nuevo y monto, seguido de los campos de estado de pago, método de pago y comprobante, con los botones "Confirmar Aceptación" y "Rechazar"] -->

**Figura 26:** Modal para procesar una solicitud de renovación o cambio de plan.

##### Rechazar una solicitud

1. En el menú de acciones de una solicitud PENDIENTE, seleccione **"Rechazar"**, o bien haga clic en el botón **"Rechazar"** dentro del modal de procesamiento.
2. Ingrese el motivo del rechazo en el campo de texto.
3. Haga clic en **"Confirmar Rechazo"**.

---

#### 5.1.9. Certificados SRI

El módulo **Certificados SRI** permite monitorear el estado de los certificados digitales de firma electrónica de todas las empresas registradas, con especial atención a los próximos a vencer.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Certificados SRI mostrando las cuatro tarjetas de estadísticas (Total, Activos, Por Vencer, Expirados), los filtros y la tabla con columnas Empresa, Emisor, Serial, Vencimiento, Estado, Días Restantes y Acciones] -->

**Figura 27:** Vista principal del módulo de Certificados SRI.

**Tarjetas de estadísticas**

La barra superior muestra cuatro indicadores: **Total de certificados**, **Activos**, **Por Vencer** (próximos a expirar) y **Expirados**. Los valores en rojo indican situaciones que requieren atención inmediata.

**Filtros disponibles**

- **Búsqueda** por nombre de empresa o RUC.
- **Estado:** Activo, Por Vencer o Expirado.

**Tabla de certificados**

| Columna            | Contenido                                                   |
| ------------------ | ----------------------------------------------------------- |
| **Empresa**        | Nombre, RUC y avatar                                        |
| **Emisor**         | Nombre de la entidad certificadora                          |
| **Serial**         | Número de serie del certificado (truncado para legibilidad) |
| **Vencimiento**    | Fecha de expiración del certificado                         |
| **Estado**         | ACTIVO o EXPIRADO (etiqueta de color)                       |
| **Días Restantes** | Número de días hasta el vencimiento                         |
| **Acciones**       | Ver Detalles, Historial                                     |

##### Ver detalles de un certificado

En el menú de acciones, seleccione **"Ver Detalles"**. El modal presenta dos bloques de información:

**Información de la empresa:**

- Nombre de la empresa, RUC, ambiente de emisión (Producción o Pruebas), tipo de emisión y estado.

**Detalles del archivo de certificado (.p12):**

- **Emisor** — Organización certificadora que emitió el certificado.
- **Sujeto** — Nombre del titular del certificado.
- **Serial** — Número de serie completo.
- **Fecha de Activación** — Cuándo comenzó a ser válido.
- **Fecha de Vencimiento** — Cuándo expira.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de detalles de certificado con los dos bloques: Información de la Empresa y Detalles del Archivo P12, mostrando todos los campos descritos] -->

**Figura 28:** Modal de detalles de certificado digital SRI.

> **Recomendación:** Revise periódicamente las empresas con certificados en estado **"Por Vencer"** y comuníquese con los administradores correspondientes para gestionar la renovación antes de que expire.

---

#### 5.1.10. Reportes

El módulo **Reportes** ofrece tres informes consolidados para analizar el desempeño global de la plataforma. Todos comparten una barra de filtros común en la parte superior.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista del módulo de Reportes mostrando la barra de filtros (selector de rango de fechas, tipo de período, botón Generar y botón Exportar PDF) y las tres pestañas de reportes (R-031 Global, R-032 Comisiones, R-033 Uso por Empresa)] -->

**Figura 29:** Vista principal del módulo de Reportes con barra de filtros y tabs de informes.

**Barra de filtros**

Todos los reportes comparten los mismos controles de filtrado:

- **Fecha de Inicio** y **Fecha de Fin** — Definen el rango temporal del análisis.
- **Tipo de rango** — Día, Mes o Año; agrupa los datos según la granularidad seleccionada.
- **Botón "Generar"** — Aplica los filtros y actualiza los datos en pantalla.
- **Botón "Exportar PDF"** — Descarga el reporte activo en formato PDF.

##### R-031: Reporte Global

Muestra el panorama general de la plataforma para el período seleccionado:

- **KPIs principales:** Ingresos totales, empresas activas, nuevos clientes.
- **Gráficos de tendencia:** Evolución de ingresos y crecimiento de empresas en el tiempo.
- **Tabla de rescates:** Empresas reactivadas o que renovaron tras una suspensión.
- **Tabla de upgrades:** Empresas que migraron a un plan superior.

##### R-032: Reporte de Comisiones

Presenta el detalle de las comisiones generadas para los vendedores en el período:

- Comisiones generadas, aprobadas y pagadas.
- Distribución por vendedor con totales y promedios.
- Gráficos de distribución porcentual.

##### R-033: Reporte de Uso por Empresa

Permite analizar el nivel de consumo de recursos de cada empresa frente a los límites de su plan:

- **Filtros avanzados** adicionales por empresa o plan específico.
- **KPIs de uso:** Consumo promedio de usuarios, establecimientos y facturas.
- **Gráficos de consumo** por empresa o período.
- **Tabla detallada** con el porcentaje de utilización de cada recurso por empresa.

---

#### 5.1.11. Auditoría

El módulo **Auditoría** registra automáticamente todos los eventos relevantes del sistema: inicios de sesión, cambios de contraseña, modificaciones de registros, aprobaciones y demás acciones críticas. Es de solo consulta; no permite editar ni eliminar registros.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Auditoría mostrando los filtros (búsqueda por usuario, selector de tipo de evento, rango de fechas) y la tabla con columnas Fecha y Hora, Módulo, Usuario, Evento (con badge de color), Detalles, IP y Acciones, con el botón "Exportar Excel" visible] -->

**Figura 30:** Vista principal del módulo de Auditoría del sistema.

**Filtros disponibles**

- **Búsqueda** por nombre de usuario o correo electrónico.
- **Tipo de Evento** — Lista desplegable con las categorías:

| Código de evento | Significado                         |
| ---------------- | ----------------------------------- |
| LOGIN_OK         | Inicio de sesión exitoso            |
| LOGIN_FALLIDO    | Intento de inicio de sesión fallido |
| LOGOUT           | Cierre de sesión                    |
| PASSWORD_CAMBIO  | Cambio de contraseña                |
| COMISION         | Eventos relacionados con comisiones |
| PLAN             | Cambios de plan de suscripción      |

- **Rango de fechas** — Fecha de inicio y fecha de fin para acotar el período consultado.

**Tabla de eventos**

| Columna             | Contenido                                                 |
| ------------------- | --------------------------------------------------------- |
| **Fecha y Hora**    | Marca temporal exacta del evento                          |
| **Módulo**          | Área del sistema donde ocurrió el evento                  |
| **Usuario / Actor** | Nombre, correo y avatar del usuario que realizó la acción |
| **Evento**          | Tipo de evento con etiqueta de color                      |
| **Detalles**        | Descripción o motivo del evento (truncado a dos líneas)   |
| **IP**              | Dirección IP desde la cual se realizó la acción           |
| **Acciones**        | Ver Detalle                                               |

**Exportar a Excel**

Haga clic en el botón **"Exportar"** (verde) para descargar la lista filtrada actual en formato Excel. El archivo se denominará `reporte_auditoria_YYYY-MM-DD.xlsx` con la fecha del día de la descarga.

##### Ver el detalle de un evento

1. En el menú de acciones de cualquier fila, seleccione **"Ver Detalle"**.
2. El modal muestra:
   - **Evento, Módulo, Fecha y Hora, Dirección IP.**
   - **Actor:** Nombre, correo electrónico y avatar.
   - **Descripción detallada** del evento.
   - **Agente de usuario** (navegador y sistema operativo desde el que se realizó la acción).

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de detalle de evento de auditoría mostrando todos los campos: evento, módulo, fecha/hora, IP, información del actor con avatar, descripción completa y agente de usuario] -->

**Figura 31:** Modal de detalle de un evento de auditoría.

---

### 5.2. Uso del Sistema – Vendedor

El Vendedor es el perfil comercial de NousTI. Su función principal es registrar y gestionar las empresas cliente que contratan el servicio, dar seguimiento a sus suscripciones y consultar el estado de sus comisiones. Al iniciar sesión, el sistema lo redirige automáticamente a su panel de inicio en `/vendedor`.

El acceso a ciertas funciones depende de los permisos habilitados por el Super Administrador. Si un permiso está desactivado, los botones correspondientes aparecerán deshabilitados o no serán visibles.

---

#### 5.2.1. Pantalla de Cuenta Bloqueada

Si el Super Administrador ha bloqueado la cuenta del vendedor, al intentar acceder a cualquier ruta protegida el sistema redirigirá automáticamente a la pantalla de cuenta bloqueada.

Esta pantalla muestra:

- Un ícono de candado en color rojo.
- El título **"Tu cuenta ha sido bloqueada"**.
- Un mensaje informando que el acceso ha sido restringido por un Super Administrador.
- Un botón **"Cerrar sesión"** que finaliza la sesión y regresa a la pantalla de inicio de sesión.

Para recuperar el acceso, el vendedor debe comunicarse con el Super Administrador para que reactive su cuenta.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Pantalla de cuenta bloqueada del vendedor mostrando el ícono de candado rojo, el título "Tu cuenta ha sido bloqueada", el mensaje descriptivo y el botón "Cerrar sesión" sobre fondo degradado morado-azul] -->

**Figura 32:** Pantalla de cuenta bloqueada del Vendedor.

---

#### 5.2.2. Panel de Inicio (Dashboard)

El Panel de Inicio es la primera pantalla que ve el vendedor al ingresar al sistema. Concentra los indicadores más importantes de su actividad comercial y facilita el acceso rápido a los módulos principales.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista completa del Panel de Inicio del Vendedor con las cuatro tarjetas de KPIs en la parte superior, el bloque de alertas urgentes a la izquierda, los accesos rápidos a la derecha y la tabla comprimida de empresas en la parte inferior] -->

**Figura 33:** Panel de Inicio del Vendedor con KPIs, alertas y accesos rápidos.

**Tarjetas de indicadores (KPIs)**

En la parte superior se presentan cuatro tarjetas de resumen:

| Indicador                 | Descripción                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Empresas Asignadas**    | Total de empresas bajo la gestión del vendedor                                                        |
| **Comisiones Pendientes** | Monto total en USD de comisiones aún no pagadas                                                       |
| **Ingresos Generados**    | Monto total en USD acumulado por ventas registradas                                                   |
| **Renovaciones Próximas** | Número de suscripciones por vencer; el indicador se resalta en rojo cuando hay al menos una pendiente |

**Tablero de Urgencias (Alertas)**

Debajo de los KPIs, el sistema muestra un bloque de alertas que requieren atención inmediata:

- **Renovaciones próximas** (ícono de advertencia en rojo): suscripciones que vencen en menos de 48 horas.
- **Comisiones recién generadas** (ícono de éxito en verde): nuevas comisiones registradas en el sistema.

Cada alerta presenta el título, una descripción breve, la fecha y hora del evento, y un botón **"Atender"** que navega directamente al módulo correspondiente.

Si no hay alertas pendientes, el bloque muestra el mensaje _"Todo bajo control"_.

**Accesos Rápidos**

A la derecha del tablero de alertas se encuentran cinco enlaces de navegación directa:

1. Registrar Empresa → Módulo **Empresas**
2. Suscripciones → Módulo **Suscripciones**
3. Mis Comisiones → Módulo **Comisiones**
4. Clientes → Módulo **Clientes**
5. Reportes → Módulo **Reportes**

**Tabla de empresas recientes**

En la parte inferior del panel se presenta una vista comprimida de las últimas empresas asignadas con cuatro columnas: nombre, plan activo, estado y fecha de vencimiento. Para ver la lista completa, haga clic en el enlace **"Ver todas"** ubicado en el encabezado de esta sección.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Sección de tabla comprimida de empresas recientes en el Dashboard del Vendedor, mostrando las columnas Empresa (con avatar e iniciales), Plan, Estado (badge verde/rojo) y Vencimiento, con el enlace "Ver todas" en la esquina superior derecha] -->

**Figura 34:** Tabla de empresas recientes en el Panel de Inicio.

---

#### 5.2.3. Gestión de Empresas

El módulo **Empresas** es el centro de operación del vendedor. Desde aquí puede registrar nuevas empresas, consultar el expediente de las existentes y gestionar sus planes de suscripción.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo Empresas del Vendedor mostrando las tres tarjetas de estadísticas (Total, Activas, Inactivas), la barra de búsqueda con filtros de Estado y Plan, el botón "Nueva Empresa" y la tabla de empresas con sus columnas] -->

**Figura 35:** Vista principal del módulo de Gestión de Empresas del Vendedor.

**Tarjetas de estadísticas**

En la parte superior se muestran tres indicadores: **Total de Empresas**, **Empresas Activas** y **Empresas Inactivas**.

**Búsqueda y filtros**

- **Campo de búsqueda:** Ingrese el nombre (razón social) o el RUC de la empresa.
- **Filtro de Estado:** Muestra todas las empresas, solo las activas o solo las inactivas.
- **Filtro de Plan:** Lista desplegable con todos los planes disponibles para filtrar por tipo de plan.

**Tabla de empresas**

| Columna             | Contenido                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **Empresa**         | Avatar con iniciales, razón social en negrita y RUC en tipografía monoespaciada                     |
| **Estado**          | Etiqueta de color: ACTIVO (verde) o INACTIVO (rojo)                                                 |
| **Plan Actual**     | Nombre del plan de suscripción vigente                                                              |
| **Uso de Recursos** | Barra de progreso que muestra la cantidad de usuarios activos sobre el máximo permitido por el plan |
| **Inicio**          | Fecha de inicio de la suscripción vigente                                                           |
| **Vencimiento**     | Fecha de vencimiento; se resalta en rojo si la suscripción ya expiró                                |
| **Acciones**        | Menú desplegable                                                                                    |

**Acciones disponibles por fila:**

| Acción                        | Disponibilidad                                                |
| ----------------------------- | ------------------------------------------------------------- |
| Ver Expediente                | Siempre disponible                                            |
| Acceder (entrar como empresa) | Solo si el permiso **"Puede Acceder a Empresas"** está activo |

##### Registrar una nueva empresa

> Este botón solo está disponible si el Super Administrador ha concedido el permiso **"Puede Crear Empresas"**. Si el permiso está inactivo, el botón aparecerá deshabilitado con la leyenda _"Creación Restringida"_.

1. Haga clic en **"Nueva Empresa"**.
2. Complete el formulario organizado en cuatro secciones:

**Sección "Información Legal":**

- **Razón Social** — Nombre legal completo de la empresa.
- **Nombre Comercial** — Nombre con el que opera públicamente.
- **RUC** — 13 dígitos, validado automáticamente según el formato del SRI Ecuador.
- **Tipo de Persona** — Natural o Jurídica.
- **Régimen Tributario** — Seleccione el régimen correspondiente según la clasificación del SRI.
- **Dirección Principal** — Dirección física (mínimo 5 caracteres).

**Sección "Información de Contacto":**

- **Email** — Dirección de correo electrónico de contacto.
- **Teléfono** — Número en formato `09XXXXXXXX` (10 dígitos comenzando en 09).

**Sección "Configuración":**

- **Obligado a llevar contabilidad** — Casilla de verificación según clasificación tributaria.

**Sección "Suscripción y Pago Inicial":**

- **Plan de Suscripción** — Seleccione el plan en la lista desplegable. El sistema calcula y muestra automáticamente el monto correspondiente.
- **Monto Pago Inicial** — Se completa automáticamente (solo lectura).
- **Estado de Pago** — Fijado como **PENDIENTE** de forma automática. El registro del pago lo gestionará el Super Administrador.

3. Haga clic en **"Crear Empresa"** para guardar, o en **"Cancelar"** para descartar.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación de empresa del Vendedor con las cuatro secciones visibles: Información Legal (con campos Razón Social, Nombre Comercial, RUC, Tipo de Persona, Régimen, Dirección), Información de Contacto, Configuración y Suscripción con el plan seleccionado y el monto calculado automáticamente] -->

**Figura 36:** Formulario de registro de nueva empresa (vista del Vendedor).

##### Ver el expediente de una empresa

1. En el menú de acciones de la fila, seleccione **"Ver Expediente"**.
2. El modal de detalles se abre con dos pestañas:

**Pestaña "General":**

- Razón Social, RUC, Nombre Comercial.
- Correo electrónico y teléfono de contacto.
- Dirección principal.

**Pestaña "Plan & Uso":**

- **Estado del Plan:** Nombre del plan vigente, fecha de vencimiento (en rojo si está vencido) y último pago registrado (monto y fecha, o _"Ninguno"_ si no hay registro).
- **Uso Actual:** Tres barras de progreso que muestran el consumo de usuarios, establecimientos y facturas mensuales en relación con los límites del plan.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de expediente de empresa del Vendedor con la pestaña "Plan & Uso" activa, mostrando las tres barras de progreso de consumo (Usuarios, Establecimientos, Facturas Mensuales) y el bloque de Estado del Plan con fecha de vencimiento] -->

**Figura 37:** Modal de expediente de empresa — pestaña Plan & Uso.

##### Cambiar el plan de una empresa

> Esta acción solo está disponible si el Super Administrador ha concedido el permiso **"Puede Gestionar Planes"**.

1. En la fila de la empresa, despliegue el menú de acciones y seleccione **"Cambiar Plan"**.
2. En el modal se presentará una lista de planes disponibles, cada uno en una tarjeta seleccionable con nombre, descripción y precio anual. El plan actualmente vigente aparece deshabilitado (no es seleccionable).
3. Haga clic en la tarjeta del nuevo plan deseado.
4. Una vez seleccionado, se desplegará la sección **"Detalles del Pago"**:
   - **Monto Recibido** — Ingrese el valor cobrado al cliente.
   - **Método** — Se registra automáticamente como _"MANUAL_VENDEDOR"_.
   - **Observaciones / Motivo** — Describa el motivo del cambio (por ejemplo: _"Upgrade por mayor cantidad de usuarios"_).
5. Haga clic en **"Actualizar Plan"** para confirmar.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de cambio de plan mostrando la lista de planes en tarjetas seleccionables (el plan actual con ícono de bloqueo y cursor deshabilitado, uno nuevo seleccionado con check), y la sección "Detalles del Pago" expandida debajo con los campos Monto Recibido, Método y Observaciones] -->

**Figura 38:** Modal de cambio de plan de suscripción (vista del Vendedor).

---

#### 5.2.4. Gestión de Clientes

El módulo **Clientes** permite al vendedor consultar los usuarios finales registrados en las empresas que gestiona. La vista es de **solo lectura**: el vendedor puede consultar la información de cada usuario pero no puede crearlos, editarlos ni eliminarlos directamente.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo Clientes del Vendedor mostrando las tres tarjetas de estadísticas (Total Clientes, Usuarios Activos, Bajas/Inactivos), los filtros de búsqueda, empresa y estado, y la tabla con columnas Cliente, Empresa, Rol, Estado, Último Acceso y Acciones] -->

**Figura 39:** Vista principal del módulo de Clientes (vista del Vendedor).

**Filtros disponibles**

- **Búsqueda** por nombre, correo electrónico o empresa.
- **Filtro por Empresa** — Lista desplegable con todas las empresas asignadas al vendedor (muestra razón social y RUC).
- **Filtro de Estado** — Todos, Activos o Inactivos.

**Tabla de clientes**

| Columna           | Contenido                                                                       |
| ----------------- | ------------------------------------------------------------------------------- |
| **Cliente**       | Avatar con iniciales, nombre completo en negrita y correo electrónico           |
| **Empresa**       | Nombre de la empresa a la que pertenece el usuario                              |
| **Rol**           | Rol asignado dentro de la empresa (Admin o Usuario)                             |
| **Estado**        | ACTIVO (verde) o INACTIVO (rojo)                                                |
| **Último Acceso** | Fecha y hora del último inicio de sesión; _"Sin registro"_ si nunca ha accedido |
| **Acciones**      | Ver Detalles                                                                    |

##### Ver detalles de un cliente

En el menú de acciones de cualquier fila, seleccione **"Ver Detalles"**. El modal muestra la información completa del usuario en modo de solo lectura: datos personales, empresa, rol, estado y último acceso.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de detalles de cliente del Vendedor mostrando la información completa en solo lectura: avatar con iniciales, nombre completo, empresa asignada, rol, estado, correo electrónico, teléfono y fecha de último acceso] -->

**Figura 40:** Modal de detalles de cliente (vista de solo lectura del Vendedor).

---

#### 5.2.5. Seguimiento de Comisiones

El módulo **Comisiones** permite al vendedor consultar el estado de todas las comisiones generadas a su nombre a partir de las ventas y renovaciones registradas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo Comisiones del Vendedor mostrando las tres tarjetas de estadísticas (Total Generado, Pendiente, Pagado en USD), los tabs de filtro por estado y la tabla de comisiones con sus columnas y badges de estado coloreadas] -->

**Figura 41:** Vista principal del módulo de Comisiones del Vendedor.

**Tarjetas de estadísticas**

La barra superior muestra tres totales en dólares: **Total Generado**, **Pendiente de pago** y **Pagado**.

**Tabs de estado**

La tabla se filtra mediante cinco pestañas:

| Pestaña             | Contenido                                                     |
| ------------------- | ------------------------------------------------------------- |
| **Todas Generadas** | Todas las comisiones sin importar el estado                   |
| **Por Aprobar**     | Comisiones en estado PENDIENTE de revisión por el Super Admin |
| **Por Pagar**       | Comisiones aprobadas pendientes de desembolso                 |
| **Historial Pagos** | Comisiones ya pagadas                                         |
| **Rechazadas**      | Comisiones rechazadas por el Super Admin                      |

**Filtros adicionales**

- **Búsqueda** por concepto o nombre de empresa.
- **Filtro por Empresa** — Lista desplegable con las empresas del vendedor.

**Tabla de comisiones**

| Columna      | Contenido                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------- |
| **Vendedor** | Avatar con iniciales, nombre y código de identificación abreviado                             |
| **Concepto** | Descripción del motivo que originó la comisión                                                |
| **Monto**    | Valor en USD y porcentaje de comisión aplicado                                                |
| **Generado** | Fecha de generación de la comisión                                                            |
| **Estado**   | Etiqueta de color: PENDIENTE (amarillo), APROBADA (naranja), RECHAZADA (rojo), PAGADA (verde) |
| **Acciones** | Ver Detalles, Ver Logs                                                                        |

##### Ver detalles de una comisión

En el menú de acciones, seleccione **"Ver Detalles"**. El modal muestra la información completa de la comisión: concepto, monto, porcentaje aplicado, fecha de generación, estado actual y observaciones registradas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de detalles de comisión mostrando el concepto, empresa origen, monto en USD, porcentaje de comisión, fecha de generación, estado con badge de color y observaciones] -->

**Figura 42:** Modal de detalles de una comisión (vista del Vendedor).

##### Ver el historial de cambios de una comisión

En el menú de acciones, seleccione **"Ver Logs"**. Se abre un modal con la línea de tiempo completa de la comisión: cada cambio de estado aparece registrado con la fecha, el responsable del cambio y las observaciones asociadas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de historial (logs) de una comisión mostrando la línea de tiempo con las entradas de cada cambio de estado: fecha y hora, estado anterior, estado nuevo y observaciones del Super Administrador] -->

**Figura 43:** Modal de historial de cambios de estado de una comisión.

---

#### 5.2.6. Seguimiento de Suscripciones

El módulo **Suscripciones** permite al vendedor monitorear el estado de los contratos de servicio de todas sus empresas asignadas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo Suscripciones del Vendedor mostrando las tarjetas de estadísticas (Activas, Vencidas, Recaudación Proyectada), los filtros de estado, pago y plan, y la tabla con columnas Empresa, Plan, Inicio, Vencimiento, Pagos y Estado] -->

**Figura 44:** Vista principal del módulo de Suscripciones del Vendedor.

**Tarjetas de estadísticas**

Tres indicadores: **Suscripciones Activas**, **Suscripciones Vencidas** y **Recaudación Proyectada** (monto total anual de las suscripciones activas).

**Filtros disponibles**

- **Búsqueda** por nombre de empresa o plan.
- **Estado de Suscripción** — Todos, Activas o Vencidas.
- **Estado de Pago** — Todos, Pagados, Pendientes o Anulados.
- **Filtro de Plan** — Lista desplegable con los planes disponibles.
- **Botón "Historial"** — Abre un modal con el historial completo de pagos de todas las suscripciones.

**Tabla de suscripciones**

| Columna         | Contenido                                                                            |
| --------------- | ------------------------------------------------------------------------------------ |
| **Empresa**     | Ícono y nombre de la empresa                                                         |
| **Plan**        | Nombre del plan y precio anual                                                       |
| **Inicio**      | Fecha de inicio de la suscripción                                                    |
| **Vencimiento** | Fecha de vencimiento; aparece en rojo con la leyenda _"X días vencido"_ si ya expiró |
| **Pagos**       | Estado del pago: PAGADO (verde), PENDIENTE (amarillo) o ANULADO (rojo)               |
| **Estado**      | ACTIVA (verde), VENCIDA (rojo) o CANCELADA (gris)                                    |

> **Nota:** El módulo de Suscripciones para el vendedor es de solo consulta. Las acciones de cobro, renovación y cancelación son gestionadas por el Super Administrador.

##### Consultar el historial de suscripciones

Haga clic en el botón **"Historial"** (parte superior derecha del módulo). El modal presenta una tabla con el registro completo de todos los ciclos de suscripción de las empresas asignadas: empresa, plan, fecha de inicio, fecha de fin, estado y fecha del último cambio.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de historial de suscripciones mostrando la tabla con columnas Empresa, Plan, Fecha Inicio, Fecha Fin, Estado y Fecha de Cambio, con varias filas de ejemplo] -->

**Figura 45:** Modal de historial general de suscripciones.

---

#### 5.2.7. Catálogo de Planes

El módulo **Planes** presenta al vendedor el catálogo de planes de suscripción disponibles en la plataforma, con sus precios y características. Este módulo es de **solo consulta**: el vendedor puede visualizar la información pero no puede crear ni modificar planes.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo Planes del Vendedor mostrando las tarjetas de estadísticas (Total Planes, Planes Activos, Planes Ocultos), los filtros de estado, visibilidad y categoría, y la tabla con columnas Nombre, Descripción, Precio Anual, Empresas, Estado y Visibilidad] -->

**Figura 46:** Vista principal del módulo de Planes (vista del Vendedor).

**Tarjetas de estadísticas**

Tres indicadores: **Total de Planes**, **Planes Activos** y **Planes Ocultos** (no visibles en el sitio web).

**Filtros disponibles**

- **Búsqueda** por nombre del plan.
- **Estado** — Activos o Inactivos.
- **Visibilidad** — Visible (público en el sitio web) u Oculto.
- **Categoría** — Básico, Profesional o Enterprise.

**Tabla de planes**

| Columna          | Contenido                                |
| ---------------- | ---------------------------------------- |
| **Nombre**       | Nombre del plan                          |
| **Descripción**  | Texto descriptivo del plan               |
| **Precio Anual** | Tarifa en dólares                        |
| **Empresas**     | Número de empresas actualmente suscritas |
| **Estado**       | ACTIVO o INACTIVO                        |
| **Visibilidad**  | PÚBLICO u OCULTO                         |
| **Acciones**     | Ver Detalles, Ver Empresas               |

---

#### 5.2.8. Reportes

El módulo **Reportes** ofrece dos informes de desempeño personal para que el vendedor analice sus ventas y comisiones dentro del período seleccionado.

> Este módulo solo está disponible si el Super Administrador ha concedido el permiso **"Puede Ver Reportes"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista del módulo Reportes del Vendedor mostrando la barra de filtros con los presets de rango (Mes Actual, Mes Anterior, Año Actual, Personalizado), los botones Generar y Exportar PDF, y las dos pestañas de reporte (R-031 Mis Empresas y R-032 Mis Comisiones) con los KPIs y gráficos visibles] -->

**Figura 47:** Vista principal del módulo de Reportes del Vendedor.

**Selector de período**

En la parte superior se presentan cuatro opciones de rango temporal:

| Opción            | Descripción                                                              |
| ----------------- | ------------------------------------------------------------------------ |
| **Mes Actual**    | Datos desde el primer día del mes en curso hasta hoy                     |
| **Mes Anterior**  | Datos del mes calendario inmediatamente anterior                         |
| **Año Actual**    | Datos desde el 1 de enero del año en curso hasta hoy                     |
| **Personalizado** | Habilita dos campos de fecha (inicio y fin) para definir un rango exacto |

Una vez seleccionado el período, haga clic en **"Generar"** para cargar los datos. Use **"Exportar PDF"** para descargar el reporte activo.

##### R-031: Mis Empresas

Presenta el desempeño de ventas del vendedor:

- **KPIs:** Total de empresas vendidas, ingresos generados y planes más vendidos.
- **Gráfico de distribución de planes** (circular): muestra qué porcentaje del total corresponde a cada plan.
- **Gráfico de ventas por mes** (circular): participación de cada mes en el total del período.
- **Tabla de empresas:** Razón social, plan contratado, monto, fecha de inicio, fecha de vencimiento y estado.

##### R-032: Mis Comisiones

Presenta el resumen de comisiones generadas:

- **KPIs:** Total de comisiones generadas, comisiones pagadas y comisiones pendientes (en USD).
- **Tabla de comisiones:** Empresa, concepto, monto de comisión, fecha de generación y estado.

---

#### 5.2.9. Seguimiento de Renovaciones

El módulo **Renovaciones** permite al vendedor registrar solicitudes de renovación o cambio de plan para sus empresas asignadas, y monitorear el estado de las solicitudes enviadas al Super Administrador.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo Renovaciones del Vendedor mostrando las tres tarjetas de estadísticas (Pendientes en rojo, Aceptadas en verde, Rechazadas en gris), los filtros de búsqueda, estado y tipo, el botón "Nueva Solicitud" y la tabla con columnas Empresa, Plan Actual, Plan Solicitado, Tipo, Fecha Solicitud y Estado] -->

**Figura 48:** Vista principal del módulo de Renovaciones del Vendedor.

**Tarjetas de estadísticas**

Tres indicadores: **Solicitudes Pendientes** (rojo), **Solicitudes Aceptadas** (verde) y **Solicitudes Rechazadas** (gris).

**Filtros disponibles**

- **Búsqueda** por nombre de empresa o plan.
- **Filtro de Estado** — Pendiente, Aceptada o Rechazada.
- **Filtro de Tipo** — Según el tipo de solicitud registrado.

**Tabla de solicitudes**

| Columna             | Contenido                                                 |
| ------------------- | --------------------------------------------------------- |
| **Empresa**         | Nombre de la empresa solicitante                          |
| **Plan Actual**     | Plan vigente de la empresa                                |
| **Plan Solicitado** | Plan nuevo solicitado                                     |
| **Tipo**            | Tipo de solicitud: RENOVACIÓN, UPGRADE o DOWNGRADE        |
| **Fecha Solicitud** | Fecha en que se registró la solicitud                     |
| **Estado**          | PENDIENTE (amarillo), ACEPTADA (verde) o RECHAZADA (rojo) |
| **Acciones**        | Ver Detalles                                              |

##### Crear una nueva solicitud de renovación

> Este botón solo está disponible si el permiso **"Puede Gestionar Planes"** está activo.

1. Haga clic en **"Nueva Solicitud"**.
2. Complete el formulario:
   - **Empresa** — Seleccione la empresa en la lista desplegable.
   - **Plan Actual** — Se completa automáticamente al seleccionar la empresa (solo lectura).
   - **Plan Nuevo** — Seleccione el plan al que se desea migrar o renovar.
   - **Tipo de Renovación** — Elija el tipo correspondiente según la acción (Renovación, Upgrade o Downgrade).
   - **Observaciones** — Campo libre para justificar o detallar la solicitud.
3. Haga clic en **"Guardar"** para enviar la solicitud al Super Administrador.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación de nueva solicitud de renovación con los campos Empresa (selector), Plan Actual (readonly, completado automáticamente), Plan Nuevo (selector), Tipo de Renovación (selector) y Observaciones (textarea), con los botones Cancelar y Guardar] -->

**Figura 49:** Formulario de creación de nueva solicitud de renovación.

---

#### 5.2.10. Mi Perfil

El módulo **Mi Perfil** permite al vendedor consultar y actualizar su información personal, cambiar su contraseña y revisar los permisos que le han sido asignados.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista del módulo Mi Perfil del Vendedor mostrando las cuatro tarjetas: Información del Perfil (avatar con iniciales, nombre, estado, tipo de comisión), Resumen de Negocio (empresas asignadas, ingresos generados, fecha de registro), Datos Personales (formulario editable) y lista de Permisos] -->

**Figura 50:** Vista general del módulo Mi Perfil del Vendedor.

La pantalla está organizada en cuatro tarjetas:

**Tarjeta "Información del Perfil"**

Muestra de forma resumida:

- Avatar con las iniciales del vendedor.
- Nombre completo y estado de la cuenta (Activo o Inactivo).
- Tipo de comisión configurado.
- Número de identificación (cédula o pasaporte).

**Tarjeta "Resumen de Negocio"**

Estadísticas de desempeño:

- Número de empresas asignadas actualmente.
- Ingresos totales generados en USD.
- Fecha de registro en el sistema.

**Tarjeta "Datos Personales"**

Formulario editable con los siguientes campos:

- **Nombres** — Editable.
- **Apellidos** — Editable.
- **Email** — Editable.
- **Teléfono** — Editable.

Para actualizar los datos:

1. Modifique el campo o campos deseados.
2. Haga clic en **"Guardar"**. Si no hay cambios, el botón permanece deshabilitado.
3. Para descartar los cambios realizados antes de guardar, haga clic en **"Cancelar"**.

**Tarjeta "Mis Permisos"**

Lista de permisos habilitados por el Super Administrador. Los permisos posibles son:

| Permiso                  | Descripción                                              |
| ------------------------ | -------------------------------------------------------- |
| Puede Crear Empresas     | Permite registrar nuevas empresas en el sistema          |
| Puede Gestionar Planes   | Permite cambiar planes y crear solicitudes de renovación |
| Puede Acceder a Empresas | Permite ingresar al entorno de las empresas asignadas    |
| Puede Ver Reportes       | Permite acceder al módulo de Reportes                    |

##### Cambiar contraseña

En la tarjeta **"Seguridad de la Cuenta"**, siga estos pasos:

1. Ingrese su **Contraseña Actual** en el primer campo.
2. Ingrese la **Contraseña Nueva** en el segundo campo. El sistema validará automáticamente la fortaleza de la contraseña.
3. Ingrese nuevamente la contraseña nueva en el campo **"Confirmar Nueva Contraseña"**. Ambas entradas deben coincidir exactamente.
4. Haga clic en **"Cambiar Contraseña"** para aplicar el cambio, o en **"Cancelar"** para descartar.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Tarjeta de Seguridad de la Cuenta del Vendedor mostrando los tres campos de contraseña (Actual, Nueva, Confirmar Nueva) con los iconos de ojo para mostrar/ocultar y los botones Cancelar y Cambiar Contraseña] -->

**Figura 51:** Tarjeta de cambio de contraseña en Mi Perfil.

---

### 5.3. Uso del Sistema – Administrador / Usuario de Empresa

El perfil **Usuario de Empresa** (con rol `ADMIN` o `USUARIO`) es el operador del negocio dentro de NousTI. Desde su entorno gestiona la emisión de facturas electrónicas, el directorio de clientes, el catálogo de productos, los gastos, los proveedores, las cuentas por cobrar y los reportes financieros de su organización.

El acceso a cada módulo y acción depende de los permisos que le haya asignado el administrador de su empresa. Si un permiso no está habilitado, los botones correspondientes estarán ocultos o deshabilitados.

La estructura de la interfaz consiste en una **barra lateral de navegación** (sidebar) a la izquierda y el **área de contenido** a la derecha. Si la empresa tiene una suscripción inactiva o vencida, aparecerá un banner de alerta en la parte superior del área de contenido.

---

#### 5.3.1. Pantallas de Acceso Restringido

El sistema dispone de dos pantallas especiales que se muestran cuando el usuario no puede acceder a los módulos habituales.

**Pantalla "Acceso Denegado"**

Se presenta cuando la cuenta del usuario ha sido desactivada por el administrador de la empresa. Muestra:

- Un ícono de escudo tachado.
- El mensaje **"Tu usuario fue inhabilitado"**.
- Instrucciones para contactar al administrador.
- El botón **"Cerrar sesión"**.
- El identificador del usuario en el pie de la tarjeta.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Pantalla de acceso denegado mostrando el ícono de escudo tachado, el título "Tu usuario fue inhabilitado", el mensaje con instrucciones, el botón Cerrar Sesión y el ID del usuario al pie] -->

**Figura 52:** Pantalla de acceso denegado para usuario desactivado.

**Pantalla "Sin Permisos"**

Se presenta cuando el usuario tiene una cuenta activa pero el administrador aún no le ha asignado ningún permiso de módulo. Muestra:

- Un ícono de candado.
- El mensaje **"No tienes permisos para acceder a ningún módulo"**.
- Instrucciones para contactar al administrador.
- El botón **"Cerrar sesión"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Pantalla "Sin Permisos" mostrando el ícono de candado, el mensaje descriptivo y el botón Cerrar sesión] -->

**Figura 53:** Pantalla de sin permisos asignados.

---

#### 5.3.2. Panel de Control (Dashboard)

El Panel de Control es la pantalla de inicio del usuario de empresa. Ofrece un resumen ejecutivo del estado financiero y operativo del negocio para el período seleccionado.

> Si la suscripción de la empresa está próxima a vencer (menos de 7 días), aparecerá un **banner de alerta** en la parte superior con el número de días restantes y un enlace de WhatsApp para contactar al asesor.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista completa del Panel de Control del Usuario de Empresa mostrando (de arriba abajo): banner de aviso de renovación si aplica, la fila de KPIs, el gráfico de tendencia de ventas a la izquierda, y la columna derecha con tarjetas de estado, acciones rápidas y top de productos] -->

**Figura 54:** Panel de Control del Administrador / Usuario de Empresa.

**Selector de período**

En la parte superior se encuentran tres botones para seleccionar el alcance temporal de los datos mostrados: **Día**, **Semana** y **Mes**. El período **Mes** está seleccionado por defecto.

**Tarjetas de KPIs**

La primera fila del panel muestra los indicadores clave de rendimiento del período seleccionado:

- **Total Ventas** — Monto total facturado y autorizado por el SRI.
- **Cantidad de Facturas** — Número de comprobantes emitidos.
- **Saldos Pendientes** — Monto total de facturas aún no cobradas.

**Gráfico de Tendencia de Ventas**

El gráfico principal (columna izquierda, 8/12 del ancho) muestra la evolución de los ingresos en el período seleccionado.

**Últimas facturas emitidas**

Debajo del gráfico se presenta una tabla comprimida con las facturas más recientes, incluyendo número, cliente, monto y estado.

**Columna derecha — Tarjetas complementarias**

La columna derecha (4/12) contiene tres bloques:

1. **Estado del sistema** — Estado de la firma electrónica SRI (activa/expirada) y consumo del plan (facturas emitidas vs. límite mensual).
2. **Acciones Rápidas** — Atajos de navegación a los módulos de Facturación, Clientes, Productos y Reportes.
3. **Top 5 Productos** — Ranking de los productos más vendidos en el período.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Columna derecha del Dashboard mostrando las tres tarjetas: Estado del sistema con indicador de firma y barra de consumo del plan, Acciones Rápidas con los cuatro accesos directos, y Top 5 Productos con el ranking] -->

**Figura 55:** Columna derecha del Panel de Control con estado del sistema, accesos rápidos y top de productos.

---

#### 5.3.3. Facturación Electrónica

El módulo **Facturación** es el núcleo operativo del sistema. Permite emitir, gestionar y dar seguimiento a todos los comprobantes electrónicos de la empresa ante el SRI.

> Si el certificado de firma electrónica no está configurado o ha expirado, el módulo mostrará un aviso de bloqueo con instrucciones para resolver la situación antes de poder emitir facturas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Facturación mostrando las tarjetas de estadísticas (Total Facturas, Total Autorizado, Pendiente de Cobro), la barra de búsqueda con filtros de Estado de Emisión, Estado de Pago y Método de Pago, el botón Nueva Factura, y la tabla de comprobantes con todas sus columnas] -->

**Figura 56:** Vista principal del módulo de Facturación Electrónica.

**Tarjetas de estadísticas**

En la parte superior se muestran tres indicadores: número total de comprobantes, monto total de facturas autorizadas y saldo pendiente de cobro.

**Filtros disponibles**

- **Búsqueda** por número de factura, nombre de cliente o identificador.
- **Estado de Emisión** — Filtra por: BORRADOR, EN_PROCESO, AUTORIZADA, DEVUELTA, NO_AUTORIZADA, ANULADA, ERROR_TÉCNICO.
- **Estado de Pago** — Filtra por: PENDIENTE, PAGADO, PARCIAL, ANULADO.
- **Método de Pago** — Filtra por forma de pago SRI (Efectivo, Tarjeta de Débito, Tarjeta de Crédito, etc.).

**Tabla de comprobantes**

| Columna                | Contenido                                                                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Comprobante / ID**   | Número de factura secuencial (o "BORRADOR") y primeros caracteres del número de autorización SRI                                                               |
| **Cliente / Receptor** | Avatar con iniciales, razón social e identificación del cliente                                                                                                |
| **Emisión**            | Fecha de emisión del comprobante                                                                                                                               |
| **Total (USD)**        | Monto total de la factura                                                                                                                                      |
| **Método Pago**        | Forma de pago SRI registrada                                                                                                                                   |
| **Estado**             | Etiqueta de estado de emisión (con spinner animado si el comprobante está siendo procesado); si está autorizada o anulada, se muestra además el estado de pago |
| **Gestión**            | Menú desplegable de acciones                                                                                                                                   |

**Acciones disponibles según el estado del comprobante:**

| Estado de emisión            | Acciones disponibles                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| **BORRADOR**                 | Ver Detalles, Editar, Enviar al SRI, Descargar PDF _(si autorizado)_, Enviar Email, Anular, Eliminar |
| **EN_PROCESO**               | Ver Detalles, Consultar SRI, Enviar Email                                                            |
| **AUTORIZADA**               | Ver Detalles, Descargar PDF, Enviar Email, Anular, Detalle de Pagos / Abonos                         |
| **DEVUELTA / ERROR_TÉCNICO** | Ver Detalles, Enviar al SRI (reintento)                                                              |
| **ANULADA**                  | Ver Detalles, Descargar PDF, Enviar Email                                                            |

##### Crear una nueva factura

1. Haga clic en el botón **"Nueva Factura"** (azul, esquina superior derecha).
2. Se abrirá el formulario de emisión. En el encabezado se indica el ambiente SRI activo de la empresa (**PRODUCCIÓN** o **PRUEBAS**) mediante una etiqueta de color.

El formulario está compuesto por tres secciones principales:

**Sección 1 — Cabecera (dos columnas)**

_Columna izquierda — Cliente / Receptor:_

- Ingrese el nombre o número de identificación del cliente en el campo de búsqueda. El sistema mostrará un menú desplegable con los resultados. También puede elegir entre las tres sugerencias rápidas que aparecen por defecto.
- Una vez seleccionado el cliente, su información (razón social, identificación, correo y dirección) se mostrará en una tarjeta de confirmación.
- Si necesita agregar un cliente nuevo en el momento, haga clic en el botón **"Nuevo"** (junto al título de la sección). Se abrirá el formulario de cliente sin cerrar la factura.
- Si el cliente ya existe y desea editarlo, haga clic en el ícono de lápiz que aparece en la tarjeta del cliente seleccionado.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de nueva factura, sección cabecera: columna izquierda mostrando el buscador de clientes con el menú desplegable de resultados abierto, las sugerencias rápidas y la tarjeta de cliente seleccionado con su información] -->

**Figura 57:** Sección de selección de cliente en el formulario de nueva factura.

_Columna derecha — Información de Emisión:_

- **Establecimiento** — Seleccione el establecimiento desde el cual se emite la factura.
- **Punto de Emisión** — Se filtra automáticamente según el establecimiento seleccionado. Elija el punto de emisión (caja/terminal).
- **Forma de Pago SRI** — Seleccione el método de pago:

| Código | Forma de pago              |
| ------ | -------------------------- |
| 01     | Efectivo                   |
| 16     | Tarjeta de Débito          |
| 17     | Dinero Electrónico         |
| 18     | Tarjeta de Prepago         |
| 19     | Tarjeta de Crédito         |
| 20     | Otros Sistemas Financieros |
| 21     | Endoso de Títulos          |
| 15     | Compensación de Deudas     |

- **Plazo y Unidad de Tiempo** — Aparecen solo si la forma de pago seleccionada requiere indicar condiciones de crédito (por ejemplo, tarjeta de crédito). Los valores posibles son: Días, Meses o Años.
- **Guía de Remisión** — Campo opcional para ingresar el número de guía de remisión en formato `000-000-000000000`.

**Sección 2 — Detalle de Productos**

Esta sección es una tabla interactiva donde se agregan las líneas de la factura.

- Utilice el campo de búsqueda superior para encontrar un producto por código o nombre. Al seleccionarlo desde el menú desplegable, se agrega automáticamente como una nueva fila en la tabla.
- Para agregar un producto que no existe en el catálogo, haga clic en el botón **"Nuevo"** (junto al buscador). Se abrirá el formulario de producto sin cerrar la factura.

Por cada fila de detalle se gestionan los siguientes campos:

| Campo                      | Descripción                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| **Producto / Descripción** | Selector de producto del catálogo, o campo de texto para descripción manual |
| **Cant.**                  | Cantidad (acepta decimales)                                                 |
| **P. Unit ($)**            | Precio unitario                                                             |
| **Desc. ($)**              | Descuento en dólares aplicado a esta línea                                  |
| **IVA**                    | Tarifa de IVA aplicable: 15%, 0%, Exento o No Objeto de IVA                 |
| **Subtotal**               | Calculado automáticamente: `(Cantidad × Precio) − Descuento`                |
| **Eliminar**               | Botón de papelera para quitar la fila                                       |

Para editar un producto directamente desde la tabla, haga clic en el ícono de lápiz que aparece junto al selector cuando hay un producto seleccionado.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Sección de detalle de productos de la factura mostrando la tabla con tres filas de ejemplo: buscador en la parte superior con dropdown de resultados, columnas de cantidad, precio unitario, descuento, IVA y subtotal calculado, y botón de eliminar en cada fila] -->

**Figura 58:** Tabla de detalle de productos en el formulario de factura.

**Sección 3 — Observaciones y Totales**

_Columna izquierda — Observaciones:_
Campo de texto libre para notas internas de la factura (por ejemplo: _"Pago contra entrega, referencia bancaria 123456"_).

_Columna derecha — Panel de Totales:_

El sistema calcula automáticamente y muestra en tiempo real:

- **Subtotal sin IVA** — Suma de líneas con IVA 0% o exentas.
- **Subtotal gravado** — Suma de líneas con IVA 15%.
- **Descuento total** — Suma de descuentos aplicados.
- **IVA (15%)** — Impuesto calculado sobre la base imponible.
- **Total** — Monto final a cobrar.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Parte inferior del formulario de factura mostrando el campo de Observaciones a la izquierda y el Panel de Totales a la derecha con los valores de subtotal sin IVA, subtotal gravado, descuento total, IVA 15% y Total en negrita] -->

**Figura 59:** Panel de observaciones y totales del formulario de factura.

**Botones de acción (pie del formulario)**

- **"Cancelar"** — Cierra el formulario sin guardar cambios.
- **"Guardar Factura"** — Guarda el comprobante en estado **BORRADOR**. Puede editarse o eliminarse posteriormente. El botón permanece deshabilitado hasta que se complete al menos un detalle de producto.
- **"Guardar y Enviar al SRI"** — Guarda el comprobante y lo envía de inmediato al SRI para autorización. Este botón solo aparece al crear una factura nueva (no en edición) y requiere el permiso `FACTURAS_ENVIAR_SRI`.

> **Importante:** Al hacer clic en "Guardar y Enviar al SRI", el sistema muestra una pantalla de espera con el mensaje _"Enviando al SRI..."_ y una lista de pasos con indicadores de progreso. No cierre ni recargue la ventana durante este proceso.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Overlay de envío al SRI superpuesto sobre el modal de factura, mostrando el spinner central, el título "Enviando al SRI", el mensaje de espera y la lista de pasos (Factura guardada ✓, Enviando al SRI... con spinner)] -->

**Figura 60:** Pantalla de espera durante el envío de la factura al SRI.

##### Ver detalles de una factura

En el menú de acciones de la tabla, seleccione **"Ver Detalles"**. Se abre el mismo formulario de creación en modo de solo lectura, con todos los datos del comprobante: cabecera, detalle de productos, observaciones y totales. El número de autorización SRI aparece destacado en el encabezado si la factura está autorizada.

##### Enviar al SRI (borrador)

Para enviar un comprobante en estado BORRADOR al SRI:

1. En el menú de acciones, seleccione **"Enviar al SRI"**.
2. El sistema pedirá confirmación. Confirme la acción.
3. El estado de la fila cambiará a **"ENVIANDO..."** con un spinner mientras se procesa.
4. Al finalizar, el estado se actualizará a AUTORIZADA (éxito) o al estado correspondiente si ocurre un rechazo.

##### Consultar estado con el SRI

Si una factura queda en estado **EN_PROCESO** (el SRI no respondió en tiempo real), seleccione **"Consultar SRI"** desde el menú de acciones. El sistema consultará el estado actualizado directamente con el SRI y actualizará la fila.

##### Descargar PDF

Seleccione **"Descargar PDF"** desde el menú de acciones de cualquier factura AUTORIZADA o ANULADA. El archivo se descargará automáticamente al equipo.

##### Enviar factura por correo electrónico

1. En el menú de acciones, seleccione **"Enviar Email"**.
2. Se abrirá un modal con el correo registrado del cliente precargado. Puede modificarlo si es necesario.
3. Haga clic en **"Enviar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de envío de factura por email mostrando el campo de dirección de correo electrónico precargado con el email del cliente y los botones Cancelar y Enviar] -->

**Figura 61:** Modal de envío de factura por correo electrónico.

##### Registrar pagos y abonos

Para facturas en estado AUTORIZADA con saldo pendiente:

1. En el menú de acciones, seleccione **"Detalle de Pagos / Abonos"**.
2. El modal mostrará el saldo pendiente actual y el historial de abonos previos.
3. Para registrar un nuevo abono, complete:
   - **Monto** — No puede superar el saldo pendiente.
   - **Fecha de pago**.
   - **Método de pago SRI** — Si no es efectivo, se solicitará número de referencia y comprobante.
   - **Observaciones** (opcional).
4. Haga clic en **"Registrar"**. El saldo pendiente se actualiza automáticamente.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de registro de pagos/abonos mostrando el saldo pendiente en la parte superior, el historial de abonos anteriores en tabla y el formulario de nuevo abono con los campos Monto, Fecha, Método de Pago y Observaciones] -->

**Figura 62:** Modal de registro de pagos y abonos de factura.

##### Anular una factura

Solo las facturas en estado **AUTORIZADA** pueden anularse:

1. En el menú de acciones, seleccione **"Anular Factura"** (resaltado en rojo).
2. Se abrirá un modal solicitando el motivo de la anulación.
3. Ingrese el motivo y haga clic en **"Confirmar Anulación"**.

> **Advertencia:** La anulación ante el SRI es irreversible. Una vez anulada, la factura no puede recuperarse.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de anulación de factura mostrando la información de la factura a anular, el campo de texto "Motivo de anulación" obligatorio y los botones Cancelar y Confirmar Anulación (en rojo)] -->

**Figura 63:** Modal de anulación de factura con campo de motivo obligatorio.

---

#### 5.3.4. Facturación Recurrente

El módulo **Facturación Recurrente** permite programar la generación automática de facturas que se repiten periódicamente (por ejemplo, facturas mensuales de servicios).

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Facturación Recurrente mostrando las tarjetas de estadísticas, la tabla de programaciones con columnas Cliente, Descripción, Frecuencia, Próxima Emisión, Estado y Acciones] -->

**Figura 64:** Vista principal del módulo de Facturación Recurrente.

Desde este módulo puede:

- **Crear programaciones** de facturación automática, configurando el cliente, los productos, la frecuencia (diaria, semanal, mensual) y la fecha de inicio.
- **Ver el historial** de facturas generadas por cada programación.
- **Pausar o reactivar** una programación sin eliminarla.
- **Eliminar** una programación que ya no se necesite.

Al crear o editar una programación, el formulario es el mismo que el de emisión de facturas normal, con la adición de la sección **"Configuración de Recurrencia"** donde se definen la frecuencia y el período de vigencia de la programación.

---

#### 5.3.5. Gestión de Clientes

El módulo **Clientes** mantiene el directorio de personas naturales y jurídicas a quienes se les emiten facturas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Clientes mostrando las tarjetas de estadísticas (Total Clientes, Clientes Activos, Con Crédito), las dos pestañas (Directorio, Analítica), la barra de búsqueda con filtros de estado, los botones Exportar y Nuevo Cliente, y la tabla con columnas Cliente, Identificación, Estado, Contacto, Crédito y Acciones] -->

**Figura 65:** Vista principal del módulo de Clientes — pestaña Directorio.

**Pestañas del módulo**

- **Directorio de Clientes** — Vista principal con la tabla de todos los clientes.
- **Analítica de Datos** — Solo disponible para el administrador de empresa. Muestra análisis de clientes inactivos, nuevos, comparativos y ranking por ventas.

**Tarjetas de estadísticas**

Tres indicadores: **Total de Clientes**, **Clientes Activos** y **Con Línea de Crédito**.

**Búsqueda y filtros**

- **Búsqueda** por nombre (razón social), número de identificación o correo electrónico.
- **Filtro de Estado** — Todos, Activos o Inactivos.
- **Botón "Exportar"** (si tiene el permiso `CLIENTES_EXPORTAR`) — Descarga la lista en formato Excel. Opcionalmente puede definir un rango de fechas de creación para filtrar la exportación.

**Tabla de clientes**

| Columna            | Contenido                                                        |
| ------------------ | ---------------------------------------------------------------- |
| **Cliente**        | Avatar con iniciales, razón social en negrita y nombre comercial |
| **Identificación** | Número de cédula/RUC/pasaporte y tipo de identificación          |
| **Estado**         | ACTIVO (verde) o INACTIVO (rojo)                                 |
| **Contacto**       | Correo electrónico y teléfono                                    |
| **Crédito**        | Límite de crédito en dólares y plazo en días                     |
| **Acciones**       | Ver Detalles, Editar, Eliminar                                   |

##### Crear un nuevo cliente

1. Haga clic en **"Nuevo Cliente"**.
2. Complete el formulario:
   - **Razón Social** — Nombre completo o razón social.
   - **Nombre Comercial** — Nombre con el que opera (opcional).
   - **Tipo de Identificación** — RUC, Cédula, Pasaporte o Venta a Consumidor Final.
   - **Identificación** — Número de cédula, RUC o pasaporte según el tipo.
   - **Email** — Correo de contacto (se usará para el envío de facturas).
   - **Teléfono** (opcional).
   - **Dirección** (opcional).
   - **Límite de Crédito** — Monto máximo de crédito permitido.
   - **Días de Plazo** — Días de plazo de pago.
   - **Activo** — Activa o desactiva el cliente.
3. Haga clic en **"Guardar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación/edición de cliente mostrando todos los campos: Razón Social, Nombre Comercial, Tipo de Identificación (selector), Identificación, Email, Teléfono, Dirección, Límite de Crédito, Días de Plazo y el toggle Activo, con los botones Cancelar y Guardar] -->

**Figura 66:** Formulario de creación o edición de cliente.

---

#### 5.3.6. Catálogo de Productos

El módulo **Productos** administra el catálogo de bienes y servicios que la empresa ofrece y que se utilizan en la emisión de facturas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Productos mostrando las tarjetas de estadísticas (Total, Activos, Sin Stock, Bajo Stock), las pestañas Catálogo y Analítica, los filtros de tipo, estado e IVA, el botón Nuevo Producto, y la tabla con columnas Producto/Código, Precio, Stock, IVA, Estado y Acciones] -->

**Figura 67:** Vista principal del módulo de Productos — pestaña Catálogo.

**Pestañas del módulo**

- **Catálogo de Productos** — Tabla con todos los productos y servicios.
- **Analítica de Inventarios** — Solo para el administrador. Incluye análisis de stock, rotación, productos más vendidos, rentabilidad y productos sin movimiento.

**Tarjetas de estadísticas**

Cuatro indicadores: **Total de Productos**, **Activos**, **Sin Stock** (stock en cero) y **Bajo Stock** (por debajo del mínimo configurado).

**Búsqueda y filtros**

- **Búsqueda** por código o nombre del producto.
- **Tipo** — Todos, Productos (físicos) o Servicios.
- **Estado** — Todos, Activos o Inactivos.
- **IVA** — Filtra por tarifa: Todos, 15%, 0%, Exento o No Objeto.

**Tabla de productos**

| Columna               | Contenido                                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Producto / Código** | Nombre del producto, código identificador y etiqueta de tipo (PRODUCTO / SERVICIO)                                                                  |
| **Precio**            | Precio de venta en dólares                                                                                                                          |
| **Stock**             | Para productos físicos: cantidad actual con indicador de color (verde = normal, naranja = bajo mínimo, rojo = agotado). Para servicios: guión (`—`) |
| **IVA**               | Porcentaje de IVA aplicado                                                                                                                          |
| **Estado**            | ACTIVO o INACTIVO                                                                                                                                   |
| **Acciones**          | Ver Detalles, Editar, Eliminar                                                                                                                      |

##### Crear un nuevo producto o servicio

1. Haga clic en **"Nuevo Producto"**.
2. Complete el formulario:
   - **Código** — Identificador único del producto.
   - **Nombre** — Nombre descriptivo.
   - **Descripción** (opcional).
   - **Tipo** — Producto (bien físico con stock) o Servicio (intangible, sin stock).
   - **Precio de Venta** — Precio unitario.
   - **Tipo de IVA** — 15%, 0%, Exento o No Objeto de IVA.
   - **Stock Actual** — Cantidad disponible (solo para tipo Producto).
   - **Stock Mínimo** — Cantidad mínima de alerta (solo para tipo Producto).
   - **Activo** — Activa o desactiva el producto en el catálogo.
3. Haga clic en **"Guardar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación/edición de producto mostrando los campos Código, Nombre, Descripción, Tipo (selector Producto/Servicio), Precio de Venta, Tipo de IVA (selector), Stock Actual y Stock Mínimo (estos dos últimos visibles solo cuando Tipo = Producto), el toggle Activo y los botones Cancelar y Guardar] -->

**Figura 68:** Formulario de creación o edición de producto.

---

#### 5.3.7. Directorio de Proveedores

El módulo **Proveedores** mantiene el registro de los proveedores de bienes y servicios de la empresa. Estos proveedores pueden asociarse a los gastos registrados.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Proveedores mostrando la tabla con columnas Proveedor (nombre + RUC), Contacto (email + teléfono), Estado y Acciones, junto con la barra de búsqueda y el botón Nuevo Proveedor] -->

**Figura 69:** Vista principal del módulo de Proveedores.

**Campos del formulario de proveedor:**

- **Nombre / Razón Social** — Nombre del proveedor.
- **RUC / Identificación** — Número de identificación tributaria.
- **Email** — Correo de contacto.
- **Teléfono** (opcional).
- **Dirección** (opcional).
- **Activo** — Activa o desactiva el proveedor.

---

#### 5.3.8. Gestión de Gastos

El módulo **Gastos** registra todos los egresos de la empresa y permite dar seguimiento a su estado de pago. La pantalla está organizada en tres pestañas.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Gastos mostrando las cuatro tarjetas de estadísticas (Total Egresos, Pagados, Pendientes, Total Registros), las tres pestañas (Movimientos, Historial de Pagos, Categorías), los filtros de búsqueda, estado y tipo, el botón Nuevo Gasto, y la tabla de gastos con sus columnas] -->

**Figura 70:** Vista principal del módulo de Gastos — pestaña Movimientos.

**Pestañas del módulo**

| Pestaña                | Permiso requerido     | Contenido                             |
| ---------------------- | --------------------- | ------------------------------------- |
| **Movimientos**        | `GESTIONAR_GASTOS`    | Lista de gastos registrados           |
| **Historial de Pagos** | `GESTIONAR_PAGOS`     | Registro de pagos efectuados          |
| **Categorías**         | `GESTIONAR_CATEGORIA` | Administración de categorías de gasto |

**Tarjetas de estadísticas (pestaña Movimientos)**

Cuatro indicadores: **Total Egresos** (monto total), **Pagados** (cantidad), **Pendientes** (cantidad) y **Total Registros**.

**Filtros disponibles**

- **Búsqueda** por concepto, número de factura o nombre de proveedor.
- **Estado** — Todos, Pendientes, Pagados o Vencidos.
- **Tipo de Gasto** — Todos, Operativo, Fijo, Variable o Financiero.

**Tabla de gastos (pestaña Movimientos)**

| Columna                  | Contenido                                                             |
| ------------------------ | --------------------------------------------------------------------- |
| **Factura**              | Número de factura del proveedor (o "S/N" si no tiene)                 |
| **Concepto / Proveedor** | Descripción del gasto y nombre del proveedor                          |
| **Categoría**            | Etiqueta de categoría                                                 |
| **Total**                | Monto total del gasto                                                 |
| **Estado**               | PENDIENTE (amarillo), PAGADO (verde), PARCIAL (azul) o VENCIDO (rojo) |
| **Fecha**                | Fecha de emisión del gasto                                            |
| **Acciones**             | Ver, Editar, Registrar Pago, Eliminar                                 |

##### Registrar un nuevo gasto

1. Haga clic en **"Nuevo Gasto"**.
2. Complete el formulario:
   - **Concepto / Descripción** — Descripción del gasto (mínimo 3 caracteres).
   - **Categoría** — Seleccione del listado (o cree una nueva en la pestaña Categorías).
   - **Proveedor** (opcional) — Seleccione del directorio de proveedores.
   - **Número de Factura** — Número de comprobante del proveedor.
   - **Fecha de Emisión** — Por defecto se carga la fecha del día.
   - **Fecha de Vencimiento** (opcional) — Si el gasto tiene plazo de pago.
   - **Subtotal** — Monto antes de impuestos.
   - **Tipo de IVA** — Tarifa del IVA aplicada.
   - **Total** — Se calcula automáticamente (solo lectura).
   - **Observaciones** (opcional).
3. Haga clic en **"Guardar"**.

> **Nota:** Una vez que un gasto tiene estado **PAGADO**, los campos de concepto, categoría, proveedor, subtotal, IVA y fechas quedan bloqueados y no pueden modificarse.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación/edición de gasto mostrando todos los campos: Concepto, Categoría (selector), Proveedor (selector opcional), Número de Factura, Fecha de Emisión, Fecha de Vencimiento, Subtotal, Tipo de IVA (selector), Total calculado en solo lectura y Observaciones, con los botones Cancelar y Guardar] -->

**Figura 71:** Formulario de registro de gasto.

##### Registrar el pago de un gasto

1. En el menú de acciones de un gasto PENDIENTE o PARCIAL, seleccione **"Registrar Pago"**.
2. Complete el formulario:
   - **Gasto** — Se precarga automáticamente (solo lectura).
   - **Monto del Pago** — Puede ser menor al total (pago parcial). El sistema valida que no supere el saldo pendiente.
   - **Fecha de Pago** — Por defecto la fecha del día.
   - **Método de Pago** — Código SRI: Efectivo (01) u otros métodos bancarizados.
   - **Número de Referencia** y **Número de Comprobante** — Obligatorios si el método no es efectivo.
   - **Observaciones** (opcional).
3. Haga clic en **"Guardar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de registro de pago de gasto mostrando el gasto precargado en solo lectura, los campos Monto del Pago, Fecha de Pago, Método de Pago (selector con códigos SRI), y los campos condicionales Número de Referencia y Número de Comprobante que aparecen cuando el método no es efectivo] -->

**Figura 72:** Formulario de registro de pago de gasto.

##### Gestionar categorías de gasto

En la pestaña **"Categorías"** puede crear y administrar las clasificaciones de gasto de su empresa:

1. Haga clic en **"Nueva Categoría"**.
2. Complete:
   - **Código** — Identificador único (por ejemplo: `SERV-PUB`). Solo acepta letras, números y guiones.
   - **Nombre** — Nombre descriptivo (mínimo 3 caracteres).
   - **Tipo** — Operativo, Fijo, Variable o Financiero.
   - **Activo** — Interruptor de activación.
   - **Descripción** (opcional).
3. Haga clic en **"Guardar"**.

---

#### 5.3.9. Cuentas por Cobrar

El módulo **Cuentas por Cobrar** presenta un resumen de todas las facturas autorizadas que tienen saldo pendiente de pago, facilitando el seguimiento de la cartera de clientes.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo Cuentas por Cobrar mostrando las tarjetas de estadísticas (Total por Cobrar, Vencidas, Por Vencer), los filtros de búsqueda y estado, y la tabla con columnas Cliente, Factura, Fecha Emisión, Fecha Vencimiento, Total, Saldo Pendiente y Acciones] -->

**Figura 73:** Vista principal del módulo de Cuentas por Cobrar.

Desde este módulo puede:

- Consultar el saldo pendiente de cada factura.
- Ver las facturas vencidas (resaltadas en rojo).
- Acceder directamente al módulo de pagos de la factura seleccionada para registrar abonos.

---

#### 5.3.10. Configuración

El módulo **Configuración** centraliza todos los ajustes administrativos de la empresa. Se accede desde el menú lateral y está organizado en un sidebar interno con cinco secciones.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista del módulo de Configuración mostrando el sidebar interno a la izquierda con las cinco secciones (Empresa, Datos SRI, Roles y Permisos, Establecimientos, Puntos de Emisión) y el área de contenido a la derecha con la sección Empresa activa, mostrando la tarjeta de información de la empresa, las estadísticas compactas y el panel lateral de suscripción] -->

**Figura 74:** Vista general del módulo de Configuración con el sidebar de secciones.

Las secciones disponibles dependen de los permisos asignados al usuario:

| Sección           | Permiso requerido           |
| ----------------- | --------------------------- |
| Empresa           | `CONFIG_EMPRESA`            |
| Datos SRI         | `CONFIG_SRI`                |
| Roles y Permisos  | `CONFIG_ROLES`              |
| Establecimientos  | `ESTABLECIMIENTO_GESTIONAR` |
| Puntos de Emisión | `PUNTO_EMISION_GESTIONAR`   |

##### Sección Empresa

Muestra la información general de la organización y el estado de la suscripción:

- **Tarjeta de información:** Razón Social, RUC, correo, teléfono y dirección.
- **Estadísticas compactas:** Número de establecimientos, puntos de emisión, ambiente SRI y fecha de expiración de la firma electrónica.
- **Panel lateral de suscripción:** Plan actual, fechas de inicio y vencimiento, consumo de comprobantes mensuales (barra de progreso), establecimientos utilizados, tipo de persona y régimen tributario.
- Si existe un último pago registrado, se muestra un banner con el monto y la fecha.

Para editar los datos de la empresa, haga clic en el botón **"Editar Empresa"**. Se abrirá un formulario con los campos básicos editables.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Sección Empresa de Configuración mostrando la tarjeta de información de la empresa a la izquierda, las estadísticas compactas y el panel lateral derecho con el estado de suscripción, las barras de progreso de consumo y la información del plan] -->

**Figura 75:** Sección Empresa dentro del módulo de Configuración.

##### Sección Datos SRI / Certificado de Firma Electrónica

Esta sección permite gestionar el certificado digital `.p12` necesario para la emisión de comprobantes electrónicos.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Sección Datos SRI mostrando el estado actual del certificado (activo/expirado), las fechas de activación y vencimiento, el ambiente configurado (Producción/Pruebas) y el botón para subir o renovar el certificado] -->

**Figura 76:** Sección de Datos SRI y certificado de firma electrónica.

Desde aquí puede:

- Consultar el estado actual del certificado: emisor, sujeto, serial, fecha de activación y fecha de vencimiento.
- Subir o renovar el archivo `.p12` del certificado cuando esté próximo a expirar.
- Configurar el ambiente de emisión: **Producción** (documentos con validez tributaria) o **Pruebas** (para pruebas sin validez fiscal).

##### Sección Establecimientos

Permite registrar los establecimientos físicos de la empresa. Cada establecimiento es una ubicación desde la cual se pueden emitir comprobantes.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Sección Establecimientos mostrando la tabla de establecimientos con columnas Código, Nombre, Dirección, Estado y Acciones (Editar, Eliminar), y el botón Nuevo Establecimiento] -->

**Figura 77:** Sección de gestión de Establecimientos.

Para crear un nuevo establecimiento:

1. Haga clic en **"Nuevo Establecimiento"**.
2. Complete:
   - **Código** — Código de 3 dígitos asignado por el SRI (por ejemplo: `001`).
   - **Nombre** — Nombre descriptivo del local.
   - **Dirección** — Dirección física del establecimiento.
   - **Activo** — Activa o desactiva el establecimiento.
3. Haga clic en **"Guardar"**.

##### Sección Puntos de Emisión

Los puntos de emisión representan las cajas o terminales de facturación dentro de cada establecimiento. Cada punto genera secuencias numéricas independientes para los comprobantes.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Sección Puntos de Emisión mostrando la tabla con columnas Establecimiento, Código del Punto, Descripción, Estado y Acciones, y el botón Nuevo Punto de Emisión] -->

**Figura 78:** Sección de gestión de Puntos de Emisión.

Para crear un nuevo punto de emisión:

1. Haga clic en **"Nuevo Punto de Emisión"**.
2. Complete:
   - **Establecimiento** — Seleccione el establecimiento al que pertenece este punto.
   - **Código** — Código de 3 dígitos del punto de emisión (por ejemplo: `001`).
   - **Descripción** — Nombre o referencia del punto (por ejemplo: _"Caja 1"_).
   - **Activo** — Activa o desactiva el punto.
3. Haga clic en **"Guardar"**.

---

#### 5.3.11. Gestión de Roles y Permisos

El módulo **Roles y Permisos** (disponible para administradores de empresa) permite definir los perfiles de acceso que se asignarán a los usuarios de la organización.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo Roles y Permisos con la columna izquierda mostrando la lista de roles (con estrella ⭐ en roles del sistema y resaltado en el rol activo seleccionado) y el botón "Crear Nuevo Rol", y la columna derecha mostrando el detalle del rol seleccionado con su nombre, descripción, y la agrupación de módulos con contadores de permisos] -->

**Figura 79:** Vista principal del módulo de Roles y Permisos.

**Columna izquierda — Lista de roles**

Muestra todos los roles definidos en la empresa. Los roles marcados con un asterisco (⭐) son roles del sistema y no pueden modificarse ni eliminarse. Al hacer clic en un rol, se carga su detalle en la columna derecha.

**Columna derecha — Detalle del rol**

Muestra la información del rol seleccionado:

- Nombre y descripción del rol.
- Etiqueta **"Del Sistema"** si aplica.
- Agrupación de permisos por módulo: CLIENTES, PRODUCTOS, FACTURAS, REPORTES, CONFIGURACIÓN, etc. Cada módulo muestra cuántos permisos están activos de los disponibles.

##### Crear un nuevo rol

1. Haga clic en **"Crear Nuevo Rol"**.
2. Ingrese el **Nombre** del rol y una **Descripción** opcional.
3. Haga clic en **"Guardar"**. El rol se creará sin permisos y aparecerá en la lista.
4. Para asignar permisos al nuevo rol, selecciónelo en la lista y haga clic en cualquier módulo del detalle.

##### Asignar permisos a un rol

1. En el detalle del rol, haga clic en el módulo cuyo conjunto de permisos desea modificar.
2. Se abrirá un modal con la lista de permisos disponibles para ese módulo, cada uno con una casilla de verificación.
3. Marque o desmarque los permisos según corresponda.
4. Haga clic en **"Guardar"** para aplicar los cambios.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de asignación de permisos mostrando el título del módulo (por ejemplo "FACTURAS"), la lista de permisos con casillas de verificación (Ver Todas, Ver Propias, Crear, Editar, Enviar al SRI, Descargar PDF, Enviar Email, Anular) y los botones Cancelar y Guardar] -->

**Figura 80:** Modal de asignación de permisos a un módulo dentro de un rol.

> **Nota:** Los roles del sistema no pueden editarse. Si necesita un perfil con permisos similares, cree un nuevo rol personalizado.

##### Eliminar un rol

En el detalle del rol, haga clic en el botón **"Eliminar"**. El sistema solicitará que ingrese el nombre del rol como confirmación. Los roles del sistema no pueden eliminarse.

---

#### 5.3.12. Gestión de Usuarios de la Empresa

El módulo **Usuarios** permite al administrador de empresa crear y gestionar las cuentas de los colaboradores que operarán el sistema.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista principal del módulo de Usuarios mostrando las tarjetas de estadísticas (Total, Activos, Inactivos), la barra de búsqueda con filtros de rol y estado, el botón Nuevo Usuario, y la tabla con columnas Nombre, Email, Rol, Estado, Último Acceso y Acciones] -->

**Figura 81:** Vista principal del módulo de Gestión de Usuarios de Empresa.

**Filtros disponibles**

- **Búsqueda** por nombre, apellido o correo electrónico.
- **Filtro de Rol** — Lista de roles definidos en la empresa.
- **Filtro de Estado** — Activos, Inactivos o Todos.

**Tabla de usuarios**

| Columna           | Contenido                                   |
| ----------------- | ------------------------------------------- |
| **Nombre**        | Nombre completo del usuario                 |
| **Email**         | Correo de acceso al sistema                 |
| **Rol**           | Rol asignado dentro de la empresa           |
| **Estado**        | ACTIVO o INACTIVO                           |
| **Último Acceso** | Fecha y hora del último inicio de sesión    |
| **Acciones**      | Ver Detalles, Editar, Cambiar Rol, Eliminar |

##### Crear un nuevo usuario

1. Haga clic en **"Nuevo Usuario"**.
2. Complete el formulario:
   - **Nombres** y **Apellidos**.
   - **Email** — Debe ser único en el sistema. Será el correo de acceso.
   - **Rol** — Seleccione el rol a asignar de la lista de roles de la empresa.
   - **Contraseña inicial** — Se define en la creación. Se recomienda indicar al usuario que la cambie en su primer acceso.
   - **Activo** — El usuario puede ser creado como inactivo si aún no debe tener acceso.
3. Haga clic en **"Guardar"**.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Modal de creación/edición de usuario mostrando los campos Nombres, Apellidos, Email, Rol (selector de roles de la empresa), Contraseña (solo en creación) y el toggle Activo, con los botones Cancelar y Guardar] -->

**Figura 82:** Formulario de creación o edición de usuario de empresa.

##### Cambiar el rol de un usuario

1. En el menú de acciones de la fila, seleccione **"Cambiar Rol"**.
2. Seleccione el nuevo rol en el modal.
3. Haga clic en **"Guardar"**.

> **Restricción:** No es posible cambiar ni eliminar el propio usuario con el que está conectado actualmente.

---

#### 5.3.13. Reportes Financieros

El módulo **Reportes** ofrece cuatro informes financieros para analizar el desempeño de la empresa. Los reportes disponibles dependen del rol del usuario.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista del módulo de Reportes mostrando la barra de filtros (selector de período con presets y opción personalizada, botones Generar y Exportar PDF) y las pestañas de reportes disponibles (Dashboard Ejecutivo R-028, Ventas Generales R-001, Cartera R-008, IVA R-027, Mis Ventas R-001E)] -->

**Figura 83:** Vista principal del módulo de Reportes con filtros y pestañas de informes.

**Acceso por perfil**

| Reporte                     | Disponible para                               |
| --------------------------- | --------------------------------------------- |
| Dashboard Ejecutivo (R-028) | Solo Administrador de Empresa                 |
| Ventas Generales (R-001)    | Solo Administrador de Empresa                 |
| Cartera (R-008)             | Solo Administrador de Empresa                 |
| IVA (R-027)                 | Solo Administrador de Empresa                 |
| Mis Ventas (R-001E)         | Todos los usuarios con permiso `REPORTES_VER` |

**Selector de período**

La mayoría de reportes usan los siguientes presets:

| Opción            | Descripción                            |
| ----------------- | -------------------------------------- |
| **Mes Actual**    | Desde el 1 del mes en curso hasta hoy  |
| **Mes Anterior**  | Todo el mes calendario anterior        |
| **Año Actual**    | Desde el 1 de enero hasta hoy          |
| **Personalizado** | Permite definir fechas de inicio y fin |

El reporte **R-027 (IVA)** tiene un selector especial:

| Opción        | Período                    |
| ------------- | -------------------------- |
| Mes Anterior  | El mes calendario anterior |
| Mes Actual    | El mes en curso            |
| Semestre 1    | Enero–Junio                |
| Semestre 2    | Julio–Diciembre            |
| Personalizado | Año y mes específico       |

Seleccione el período y haga clic en **"Generar"** para cargar los datos. Luego use **"Exportar PDF"** para descargar el informe.

##### R-028: Dashboard Ejecutivo

Resumen financiero global del período: ingresos totales, facturas emitidas, clientes nuevos, top productos y comparativa respecto al período anterior.

##### R-001: Ventas Generales

Detalle de todas las facturas autorizadas en el período, con subtotales por forma de pago, cliente y producto.

##### R-008: Cartera (Cuentas por Cobrar)

Análisis del saldo pendiente de cobro: facturas vencidas, por vencer y al día. Incluye antigüedad de saldos por cliente.

##### R-027: Informe de IVA

Tabla de valores de IVA para la declaración tributaria: base imponible 0%, base imponible 15%, IVA cobrado, subtotales y total del período seleccionado.

##### R-001E: Mis Ventas

Reporte individual del usuario en sesión: facturas emitidas por este usuario en el período, monto total y detalle por cliente.

---

#### 5.3.14. Mi Perfil

El módulo **Mi Perfil** permite al usuario consultar y actualizar su información personal, cambiar su contraseña y revisar los permisos que le han sido asignados.

La pantalla está organizada en tres columnas:

**Columna izquierda**

- **Tarjeta de información:** Avatar con iniciales en gradiente de color, nombre completo, rol asignado, estado de la cuenta y correo de acceso con fecha del último acceso.
- **Tarjeta de empresa:** Información de la empresa a la que pertenece el usuario.

**Columna central**

- **Datos Personales:** Formulario con campos de nombres, apellidos y teléfono editables. Para guardar cambios, haga clic en **"Guardar"**. Si no hay modificaciones, el botón estará deshabilitado.
- **Cambio de Contraseña:** Formulario con campos de contraseña actual, contraseña nueva y confirmación. Las contraseñas deben coincidir. Haga clic en **"Cambiar Contraseña"** para aplicar.
- **Información de auditoría:** Fecha de registro en el sistema y estado de la cuenta.

**Columna derecha**

- **Mis Permisos:** Lista de todos los permisos asignados al usuario, agrupados y con etiquetas de color por módulo.

<!-- [INSERTE CAPTURA DE PANTALLA AQUÍ: Vista completa del módulo Mi Perfil mostrando las tres columnas: izquierda con la tarjeta de información del usuario (avatar, nombre, rol, correo) y la tarjeta de empresa; centro con el formulario de datos personales editable, el formulario de cambio de contraseña y la información de auditoría; y derecha con la lista de permisos agrupados por módulo] -->

**Figura 84:** Vista general del módulo Mi Perfil del Usuario de Empresa.

> **Nota:** Si al iniciar sesión el sistema le indica que debe cambiar su contraseña, aparecerá una alerta amarilla en la parte superior del perfil con el mensaje _"Cambio de contraseña requerido"_. Realice el cambio desde la tarjeta de seguridad antes de continuar usando el sistema.
