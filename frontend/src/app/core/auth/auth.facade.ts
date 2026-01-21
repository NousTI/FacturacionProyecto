import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/enums/role.enum';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthFacade {
    private userSubject: BehaviorSubject<User | null>;
    public user$: Observable<User | null>;

    private isAuthenticatedSubject: BehaviorSubject<boolean>;
    public isAuthenticated$: Observable<boolean>;

    constructor(private authService: AuthService, private router: Router) {
        this.userSubject = new BehaviorSubject<User | null>(this.authService.getUser());
        this.user$ = this.userSubject.asObservable();
        this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.authService.isAuthenticated());
        this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

        // Validar sesión proactivamente al cargar
        this.checkSessionStatus();
    }

    private checkSessionStatus(): void {
        if (this.authService.isAuthenticated()) {
            this.authService.getPerfil().subscribe({
                next: (userData) => {
                    // Refresh user data with fresh info from server
                    const role = this.authService.getRole();
                    const updatedUser = { ...userData, role: role || undefined };

                    // Update Facade state
                    this.userSubject.next(updatedUser);

                    // Update AuthService/localStorage cache
                    this.authService.updateUser(updatedUser);
                },
                error: () => {
                    // Si falla (ej. 401 por sesión invalida en DB), forzar logout
                    this.logout();
                }
            });
        }
    }

    login(correo: string, clave: string): Observable<any> {
        // Return observable to let component handle success/error (e.g. stop loading spinner)
        // But we tap into it to update state
        return new Observable(observer => {
            this.authService.login(correo, clave).subscribe({
                next: (response) => {
                    this.isAuthenticatedSubject.next(true);
                    // Update user with role
                    const role = this.authService.getRole();
                    const userWithRole = { ...response.usuario, role: role || undefined };
                    this.userSubject.next(userWithRole);
                    observer.next(response);
                    observer.complete();
                    this.navigateBasedOnRole(role);
                },
                error: (err) => {
                    observer.error(err);
                }
            });
        });
    }

    logout(): void {
        const role = this.getUserRole();
        this.authService.logout(role);
        this.userSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
    }

    getUserRole(): UserRole | null {
        return this.authService.getRole();
    }

    private navigateBasedOnRole(role: UserRole | null): void {
        this.router.navigate(['/dashboard']);
    }
}
