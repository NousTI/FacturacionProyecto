import { Injectable } from '@angular/core';
import { Observable, from, map, tap } from 'rxjs';
import { AuthResponse } from '../../domain/models/auth.model';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/enums/role.enum';
import { http } from '../../../api/http';
import { API_ENDPOINTS } from '../../../api/endpoint';
import { ApiResponse } from '../../../api/types';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'auth_user';

    login(correo: string, clave: string): Observable<AuthResponse> {
        return from(http.post<ApiResponse<AuthResponse>>(API_ENDPOINTS.AUTH.LOGIN, { correo, clave })).pipe(
            map(response => response.data.detalles),
            tap(response => this.saveSession(response))
        );
    }

    logout(): void {
        const cleanup = () => {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            localStorage.clear();
        };

        // Note: The interceptor handles 401/403, but manual logout still calls the endpoint
        from(http.post(API_ENDPOINTS.AUTH.LOGOUT, {})).subscribe({
            next: () => cleanup(),
            error: () => cleanup() // Cleanup anyway on error
        });
    }

    getPerfil(): Observable<any> {
        return from(http.get<ApiResponse<any>>(API_ENDPOINTS.AUTH.PERFIL)).pipe(
            map(response => response.data.detalles)
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
        const user = this.getUser();
        return user?.role ? (user.role as UserRole) : null;
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    private saveSession(response: AuthResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.access_token);
        // El rol ya viene inyectado en el objeto usuario desde el backend
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.usuario));
    }
}
