import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthFacade } from '../auth/auth.facade';
import { UserRole } from '../../domain/enums/role.enum';

@Injectable({
    providedIn: 'root'
})
export class CompanyActiveGuard implements CanActivate {
    constructor(private authFacade: AuthFacade, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
        return this.authFacade.user$.pipe(
            take(1),
            map(user => {
                // 1. SuperAdmins y Vendedores siempre tienen acceso
                if (user?.role === UserRole.SUPERADMIN || user?.role === UserRole.VENDEDOR) {
                    return true;
                }

                // 2. Rutas permitidas incluso si la empresa está inactiva
                const allowedPaths = [
                    '/usuario/empresa',
                    '/usuario/perfil',
                    '/auth/login',
                    '/auth/logout'
                ];

                const isAllowedPath = allowedPaths.some(path => state.url.startsWith(path));
                if (isAllowedPath) {
                    return true;
                }

                // 3. Verificación de Empresa y Suscripción
                const isEmpresaInactiva = user?.empresa_activa === false;
                const isSuscripcionInactiva = user?.empresa_suscripcion_estado && user.empresa_suscripcion_estado !== 'ACTIVA';
                
                if ((isEmpresaInactiva || isSuscripcionInactiva) && user?.role === UserRole.USUARIO) {
                    console.warn('[CompanyActiveGuard] Acceso restringido por estado de cuenta/suscripción');
                    // Redirigir a la única página permitida para usuarios bloqueados
                    return this.router.createUrlTree(['/usuario/empresa']);
                }

                return true;
            })
        );
    }
}
