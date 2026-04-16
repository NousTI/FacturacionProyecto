import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthFacade } from '../auth/auth.facade';
import { UserRole } from '../../domain/enums/role.enum';
import { Observable, map, take } from 'rxjs';
import { LockStatusService } from '../services/lock-status.service';

@Injectable({
    providedIn: 'root'
})
export class UserActiveGuard implements CanActivate {
    constructor(
        private authFacade: AuthFacade,
        private router: Router,
        private lockService: LockStatusService
    ) { }

    canActivate(): boolean | Observable<boolean | UrlTree> {
        // 0. Omitir validaciones si se está cerrando sesión
        if (this.lockService.isLoggingOutValue) {
            return true;
        }

        return this.authFacade.user$.pipe(
            take(1),
            map(user => {
                // Si no hay usuario, AuthGuard se encargará
                if (!user) return true;

                // Solo aplicamos esta restricción a usuarios de empresa (USUARIO)
                // SuperAdmins y Vendedores tienen sus propias reglas
                if (user.role !== UserRole.USUARIO) {
                    console.log('[UserActiveGuard] No es USUARIO, dejando pasar. role:', user.role);
                    return true;
                }

                // Si el perfil del usuario en la empresa está desactivado (activo === false)
                // Redirigir a la página de acceso denegado
                if (user.activo === false) {
                    console.warn('[UserActiveGuard] Perfil inactivo → redirigiendo a /acceso-denegado');
                    return this.router.createUrlTree(['/acceso-denegado']);
                }

                console.log('[UserActiveGuard] Usuario activo, dejando pasar.');
                return true;
            })
        );
    }
}
