import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthFacade } from '../auth/auth.facade';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authFacade: AuthFacade, private router: Router) { }

    canActivate(): Observable<boolean | UrlTree> {
        return this.authFacade.isAuthenticated$.pipe(
            take(1),
            map(isAuthenticated => {
                if (isAuthenticated) {
                    return true;
                } else {
                    return this.router.createUrlTree(['/auth/login']);
                }
            })
        );
    }
}
