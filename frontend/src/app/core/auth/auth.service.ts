import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from '../api/base-api.service';
import { Observable, tap, finalize, of, map } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthResponse } from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/enums/role.enum';

@Injectable({
    providedIn: 'root'
})
export class AuthService extends BaseApiService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    constructor(http: HttpClient) {
        super(http);
    }

    login(correo: string, clave: string): Observable<AuthResponse> {
        return this.post<any>('autenticacion/iniciar-sesion', { correo, clave }).pipe(
            map(response => response.detalles),
            tap(response => this.saveSession(response))
        );
    }

    logout(role: UserRole | null): void {
        const cleanup = () => {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            localStorage.clear(); // Limpiar todo para estar seguros
        };

        if (role) {
            this.post(`autenticacion/${role}/cerrar-sesion`, {}).pipe(
                catchError(err => {
                    console.error('Error al cerrar sesión en el backend', err);
                    return of(null);
                }),
                finalize(() => cleanup())
            ).subscribe();
        } else {
            cleanup();
        }
    }

    getPerfil(): Observable<any> {
        return this.get<any>('autenticacion/perfil').pipe(
            map(response => response.detalles)
        );
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getUser(): User | null {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    updateUser(user: User): void {
        const currentUser = this.getUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, ...user };
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
        }
    }

    getRole(): UserRole | null {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role as UserRole;
        } catch (e) {
            console.error('Error parsing token', e);
            return null;
        }
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    private saveSession(response: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.access_token);
        // Add role from token to user object for easy access if needed, though Facade handles state
        const role = this.getRoleFromToken(response.access_token);
        const userWithRole = { ...response.usuario, role };
        localStorage.setItem(this.USER_KEY, JSON.stringify(userWithRole));
    }

    private getRoleFromToken(token: string): UserRole | null {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.role as UserRole;
        } catch (e) {
            return null;
        }
    }
}
