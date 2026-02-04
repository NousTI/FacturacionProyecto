import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/enums/role.enum';
import { Router } from '@angular/router';
import { UiService } from '../../shared/services/ui.service';

import { ROLES } from '../../../shared/constantes/app.constants';

@Injectable({
    providedIn: 'root'
})
export class AuthFacade {
    private userSubject: BehaviorSubject<User | null>;
    public user$: Observable<User | null>;

    private isAuthenticatedSubject: BehaviorSubject<boolean>;
    public isAuthenticated$: Observable<boolean>;

    constructor(
        private authService: AuthService,
        private router: Router,
        private uiService: UiService
    ) {
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
                    const updatedUser = { ...userData, role: role || null };

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
        return new Observable(observer => {
            this.authService.login(correo, clave).subscribe({
                next: (response) => {
                    this.isAuthenticatedSubject.next(true);

                    // En el nuevo backend, el rol viene dentro del objeto usuario como 'role'
                    const userWithRole = response.usuario;
                    const role = (userWithRole.role || this.authService.getRole()) as UserRole;

                    // Asegurar que el objeto en el subject tenga el rol detectado
                    this.userSubject.next({ ...userWithRole, role });

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
        this.authService.logout();
        this.userSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.uiService.showToast('Has cerrado sesión correctamente', 'info');
        this.router.navigate(['/auth/login']);
    }

    getUserRole(): UserRole | null {
        return this.authService.getRole();
    }

    getUser(): User | null {
        return this.authService.getUser();
    }

    private navigateBasedOnRole(role: string | null): void {
        // Lógica de redirección dinámica basada en el rol inyectado
        if (role === UserRole.SUPERADMIN) {
            this.router.navigate(['/']); // Superadmin va a raíz que es su dashboard
        } else if (role === UserRole.VENDEDOR) {
            this.router.navigate(['/vendedor']);
        } else {
            // Usuario regular
            this.router.navigate(['/usuario']);
        }
    }
}
