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
                // 2. Si no hay usuario autenticado, AuthGuard se encarga
                if (!user) return this.router.createUrlTree(['/auth/login']);

                // 3. SuperAdmins y Vendedores siempre tienen acceso
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
                    let lockType: 'COMPANY_DISABLED' | 'SUBSCRIPTION_SUSPENDIDA' | 'SUBSCRIPTION_CANCELADA' = 'COMPANY_DISABLED';
                    if (isEmpresaInactiva) {
                        lockType = 'COMPANY_DISABLED';
                    } else if (estado === 'SUSPENDIDA') {
                        lockType = 'SUBSCRIPTION_SUSPENDIDA';
                    } else if (estado === 'CANCELADA') {
                        lockType = 'SUBSCRIPTION_CANCELADA';
                    }

                    this.lockStatusService.setLock(lockType);
                    this.lockStatusService.setShowModal(true);

                    console.warn('[CompanyActiveGuard] Acceso restringido por estado de cuenta/suscripción');
                    return this.router.createUrlTree(['/usuario/acceso-restringido']);
                }

                return true;
            })
        );
    }
}
