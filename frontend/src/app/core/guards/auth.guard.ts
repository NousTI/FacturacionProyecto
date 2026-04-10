import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(): boolean | UrlTree {
        const isAuthenticated = this.authService.isAuthenticated();
        if (isAuthenticated) {
            return true;
        } else {
            return this.router.createUrlTree(['/auth/login']);
        }
    }
}
