import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { PermissionsService } from '../auth/permissions.service';
import { UserRole } from '../../domain/enums/role.enum';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private permissionsService: PermissionsService,
        private router: Router
    ) { }

    canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
        const userRole = this.authService.getRole();
        const expectedRoles: UserRole[] = route.data['roles'];

        if (!userRole) {
            return this.router.createUrlTree(['/auth/login']);
        }

        // 1. Check Role-based access
        if (expectedRoles && expectedRoles.length > 0) {
            if (!expectedRoles.includes(userRole)) {
                // Redirigir a "su casa" según el rol si no tiene acceso a esta ruta
                if (userRole === UserRole.VENDEDOR) {
                    return this.router.createUrlTree(['/vendedor']);
                } else if (userRole === UserRole.SUPERADMIN) {
                    return this.router.createUrlTree(['/']);
                } else if (userRole === UserRole.USUARIO) {
                    return this.router.createUrlTree(['/usuario']);
                }

                return this.router.createUrlTree(['/auth/login']);
            }
        }

        // 2. Check Granular Permission
        const requiredPermission = route.data['permission'];
        if (requiredPermission && !this.permissionsService.hasPermission(requiredPermission)) {
            // Si tiene el rol pero no el permiso específico
            if (userRole === UserRole.USUARIO) {
                return this.router.createUrlTree(['/usuario/dashboard']);
            }
            return false;
        }

        return true;
    }
}
