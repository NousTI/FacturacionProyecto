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
        const userRole = this.authFacade.getUserRole();
        const expectedRoles: UserRole[] = route.data['roles'];

        if (!userRole) {
            return this.router.createUrlTree(['/auth/login']);
        }

        // 1. Check Role-based access
        if (expectedRoles && expectedRoles.length > 0) {
            if (!expectedRoles.includes(userRole)) {
                // Redirect to a safe route if unauthorized for this role
                if (userRole === UserRole.VENDEDOR) {
                    return this.router.createUrlTree(['/vendedor']);
                } else if (userRole === UserRole.SUPERADMIN) {
                    return this.router.createUrlTree(['/']);
                }
                return this.router.createUrlTree(['/auth/login']);
            }
        }

        // 2. Check Granular Permission
        const requiredPermission = route.data['permission'];
        if (requiredPermission && !this.authFacade.hasPermission(requiredPermission)) {
            // If user has the role but lacks the specific permission
            this.router.navigate(['/usuario/dashboard']); // Go back to dashboard or show error
            return false;
        }

        return true;

        return this.router.createUrlTree(['/auth/login']);
    }
}
