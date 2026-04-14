import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthFacade } from '../auth/auth.facade';
import { UserRole } from '../../domain/enums/role.enum';
import { LockStatusService } from '../services/lock-status.service';

@Injectable({
    providedIn: 'root'
})
export class CompanyActiveGuard implements CanActivate {
    constructor(
        private authFacade: AuthFacade,
        private router: Router,
        private lockStatusService: LockStatusService
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        // 1. Escapar de inmediato si ya estamos en la página segura para evitar bucles
        const currentUrl = state.url.toLowerCase();
        if (currentUrl.includes('acceso-restringido')) {
            return new Observable(obs => obs.next(true));
        }

        return this.authFacade.user$.pipe(
            take(1),
            map(user => {
                // 2. SuperAdmins y Vendedores siempre tienen acceso
                if (user?.role === UserRole.SUPERADMIN || user?.role === UserRole.VENDEDOR) {
                    return true;
                }

                // 3. Rutas permitidas incluso si la empresa está inactiva
                const allowedPaths = [
                    '/usuario/acceso-restringido',
                    '/auth/login',
                    '/auth/logout'
                ];

                const isAllowedPath = allowedPaths.some(path => currentUrl.includes(path.toLowerCase()));
                if (isAllowedPath) {
                    return true;
                }

                // 4. Verificación de Empresa y Suscripción
                const isEmpresaInactiva = user?.empresa_activa === false;
                const estado = user?.empresa_suscripcion_estado;
                const isSuscripcionBloqueada = estado === 'CANCELADA' || estado === 'SUSPENDIDA';

                if ((isEmpresaInactiva || isSuscripcionBloqueada) && user?.role === UserRole.USUARIO) {
                    // Determinar el tipo de bloqueo exacto
                    if (isEmpresaInactiva) {
                        this.lockStatusService.setLock('COMPANY_DISABLED');
                    } else if (estado === 'SUSPENDIDA') {
                        this.lockStatusService.setLock('SUBSCRIPTION_SUSPENDIDA');
                    } else if (estado === 'CANCELADA') {
                        this.lockStatusService.setLock('SUBSCRIPTION_CANCELADA');
                    }
                    console.warn('[CompanyActiveGuard] Acceso restringido por estado de cuenta/suscripción');
                    return this.router.createUrlTree(['/usuario/acceso-restringido']);
                }

                return true;
            })
        );
    }
}
