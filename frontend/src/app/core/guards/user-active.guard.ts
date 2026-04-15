import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '../auth/auth.facade';
import { UserRole } from '../../domain/enums/role.enum';
import { Observable, map, take } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserActiveGuard implements CanActivate {
    constructor(
        private authFacade: AuthFacade,
        private router: Router
    ) { }

    canActivate(): Observable<boolean | UrlTree> {
        return this.authFacade.user$.pipe(
            take(1),
            map(user => {
                // Si no hay usuario, AuthGuard se encargará
                if (!user) return true;

                // Solo aplicamos esta restricción a usuarios de empresa (USUARIO)
                // SuperAdmins y Vendedores tienen sus propias reglas
                if (user.role !== UserRole.USUARIO) {
                    return true;
                }

                // Si el perfil del usuario en la empresa está desactivado (activo === false)
                // Redirigir a la página de acceso denegado
                if (user.activo === false) {
                    console.warn('[UserActiveGuard] Perfil de usuario inactivo. Redirigiendo a /acceso-denegado');
                    return this.router.createUrlTree(['/acceso-denegado']);
                }

                return true;
            })
        );
    }
}
