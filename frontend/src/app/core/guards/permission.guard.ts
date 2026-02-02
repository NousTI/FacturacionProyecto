import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionsService } from '../auth/permissions.service';
import { UiService } from '../../shared/services/ui.service';

export const permissionGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const permissionsService = inject(PermissionsService);
    const router = inject(Router);
    const uiService = inject(UiService);

    const requiredPermission = route.data['permission'];

    if (!requiredPermission) {
        return true; // Si no se define permiso, asume público/autenticado básico
    }

    if (permissionsService.hasPermission(requiredPermission)) {
        return true;
    }

    uiService.showToast('No tienes permiso para acceder a esta sección.', 'danger');
    // O redirigir a dashboard o página de error
    // router.navigate(['/dashboard']); 
    return false;
};
