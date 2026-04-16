import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthFacade } from '../auth/auth.facade';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PublicGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private authFacade: AuthFacade,
        private router: Router
    ) { }

    canActivate(): boolean | UrlTree {
        const isAuthenticated = this.authService.isAuthenticated();
        
        if (isAuthenticated) {
            const role = this.authService.getRole();
            this.authFacade.navigateBasedOnRole(role);
            return false;
        }
        
        return true;
    }
}
