# Sistema de Facturación - Documentación

## Estado de Módulos

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Autenticación** | ✅ | Login/logout, tokens JWT |
| **Users** | ✅ | Tabla de autenticación |
| **Superadmin** | ✅ | Administración global |
| **Vendedores** | ✅ | Gestión de vendedores |
| **Usuarios** | ✅ | Perfiles de empresa (usa `empresa_rol_id`) |
| **Empresas** | ✅ | CRUD de empresas |
| **Clientes** | ✅ | CRUD de clientes |
| **Roles** | ✅ | Roles personalizados por empresa |
| **Permisos** | ✅ | Catálogo de permisos del sistema |
| **Roles_Permisos** | ✅ | Asignación de permisos a roles |
| **Planes** | ✅ | Planes de suscripción |
| **Suscripciones** | ✅ | Estado de suscripciones |
| **Suscripciones_Log** | ✅ | Historial de cambios |
| **Pagos_Suscripciones** | ✅ | Registro de pagos |
| **Comisiones** | ✅ | Comisiones de vendedores |
| **Comisiones_Logs** | ✅ | Historial de comisiones |

---

## Endpoints por Módulo

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Usuario actual

### Usuarios
- `GET /api/usuarios` - Listar usuarios de la empresa
- `POST /api/usuarios` - Crear usuario (crea en users + usuarios)
- `GET /api/usuarios/{id}` - Obtener usuario
- `PUT /api/usuarios/{id}` - Actualizar usuario
- `DELETE /api/usuarios/{id}` - Eliminar usuario

### Roles
- `GET /api/roles` - Listar roles de la empresa
- `POST /api/roles` - Crear rol con permisos
- `GET /api/roles/{id}` - Obtener rol con permisos
- `PUT /api/roles/{id}` - Actualizar rol y permisos
- `DELETE /api/roles/{id}` - Eliminar rol (no sistema)
- `POST /api/roles/{rol_id}/permisos/{permiso_id}` - Asignar permiso
- `DELETE /api/roles/{rol_id}/permisos/{permiso_id}` - Remover permiso

### Permisos
- `GET /api/roles/permisos` - Listar todos los permisos
- `POST /api/roles/permisos` - Crear permiso (superadmin)

### Empresas
- `GET /api/empresas` - Listar empresas
- `POST /api/empresas` - Crear empresa
- `GET /api/empresas/{id}` - Obtener empresa
- `PUT /api/empresas/{id}` - Actualizar empresa
- `DELETE /api/empresas/{id}` - Eliminar empresa

### Clientes
- `GET /api/clientes` - Listar clientes de la empresa
- `POST /api/clientes` - Crear cliente
- `GET /api/clientes/{id}` - Obtener cliente
- `PUT /api/clientes/{id}` - Actualizar cliente
- `DELETE /api/clientes/{id}` - Eliminar cliente

### Vendedores
- `GET /api/vendedores` - Listar vendedores (superadmin)
- `POST /api/vendedores` - Crear vendedor
- `GET /api/vendedores/{id}` - Obtener vendedor
- `PUT /api/vendedores/{id}` - Actualizar vendedor
- `DELETE /api/vendedores/{id}` - Eliminar vendedor
- `GET /api/vendedores/stats` - Estadísticas globales
- `POST /api/vendedores/{id}/toggle` - Activar/desactivar

### Planes
- `GET /api/planes` - Listar planes disponibles
- `POST /api/planes` - Crear plan
- `GET /api/planes/{id}` - Obtener plan
- `PUT /api/planes/{id}` - Actualizar plan
- `DELETE /api/planes/{id}` - Eliminar plan

### Suscripciones
- `GET /api/suscripciones` - Listar suscripciones
- `POST /api/suscripciones` - Crear/actualizar suscripción
- `GET /api/suscripciones/{id}` - Obtener suscripción
- `GET /api/suscripciones/{id}/historial` - Ver historial de cambios

### Pagos de Suscripciones
- `GET /api/pagos` - Listar pagos
- `POST /api/pagos` - Registrar pago
- `GET /api/pagos/{id}` - Obtener pago
- `PUT /api/pagos/{id}` - Actualizar estado de pago

### Comisiones
- `GET /api/comisiones` - Listar comisiones
- `POST /api/comisiones` - Crear comisión
- `GET /api/comisiones/{id}` - Obtener comisión
- `PUT /api/comisiones/{id}` - Actualizar comisión
- `GET /api/comisiones/{id}/historial` - Ver historial de cambios

---

## Notas

- **Multi-tenant**: Todos los módulos filtran por `empresa_id`
- **RBAC**: Control de acceso con roles y permisos
- **Audit**: Comisiones y Suscripciones tienen logs
- **Dual Table**: Usuarios usa `users` (auth) + `usuarios` (perfil)
- **Patrón**: Todos siguen estructura de 5 archivos