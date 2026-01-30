import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthFacade } from '../auth/auth.facade';
import { UserRole } from '../../domain/enums/role.enum';

@Injectable({
    providedIn: 'root'
})
export class RoleGuard implements CanActivate {
    constructor(private authFacade: AuthFacade, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
        const expectedRoles: UserRole[] = route.data['roles'];
        const userRole = this.authFacade.getUserRole();

        if (!userRole) {
            return this.router.createUrlTree(['/auth/login']);
        }

        if (!expectedRoles || expectedRoles.length === 0) {
            return true; // No roles restricted
        }

        if (expectedRoles.includes(userRole)) {
            return true;
        }

        // Redirect to a safe route if unauthorized for this view
        if (userRole === UserRole.VENDEDOR) {
            return this.router.createUrlTree(['/vendedor']);
        } else if (userRole === UserRole.SUPERADMIN) {
            return this.router.createUrlTree(['/']);
        }

        return this.router.createUrlTree(['/auth/login']);
    }
}
