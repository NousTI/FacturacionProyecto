# Sistema de Facturación - Frontend Angular

Este proyecto es la migración del frontend a Angular 19 + Bootstrap 5.

## Requisitos
- Node.js v18+
- Angular CLI (`npm install -g @angular/cli`)

## Instalación
```bash
cd frontend-ng
npm install
```

## Ejecución
Para iniciar el servidor de desarrollo:
```bash
npm start
# o
ng serve
```
La aplicación estará disponible en `http://localhost:4200/`.

## Estructura
- `src/app/core`: Servicios singleton (Auth, Interceptors).
- `src/app/shared`: Componentes reutilizables (Feedback, Modales).
- `src/app/features`: Módulos funcionales (Auth, Dashboard).

## Características Implementadas
- **Autenticación**: Login, Perfil, Guardias de seguridad.
- **Dashboard**: Clon visual con Sidebar y Header.
- **Feedback**: Sistema global de notificaciones y carga.
