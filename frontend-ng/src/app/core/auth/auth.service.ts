import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of, throwError, from } from 'rxjs';

// TODO: Move to environments
const API_URL = 'http://localhost:8000/api';

export interface User {
    id: string; // UUID
    email: string;
    nombres: string;
    apellidos: string;
    activo: boolean;
    created_at: string;
    updated_at: string;
    last_login: string | null;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    // State with Signals
    private currentUserSignal = signal<User | null>(null);

    // Computed values
    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly isAuthenticated = computed(() => !!this.currentUserSignal());

    constructor() {
        this.restoreSession();
    }

    private restoreSession(): void {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            try {
                this.currentUserSignal.set(JSON.parse(storedUser));
            } catch (e) {
                this.clearSession();
            }
        }
    }

    login(credentials: { email: string; password: string }): Observable<User> {
        return this.http.post<any>(`${API_URL}/superadmin/login`, credentials).pipe(
            map(response => {
                // Backend returns { data: { access_token, user, token_type }, message, status_code }
                // OR standard OAuth2 response depending on implementation. 
                // Based on React code: json.data contains access_token and user.
                return response.data;
            }),
            tap((data: AuthResponse) => {
                this.setSession(data);
            }),
            map(data => data.user),
            catchError(error => {
                let errorMessage = 'Error al iniciar sesión';

                // Check if it's a backend structured error response
                if (error.error) {
                    if (typeof error.error.detail === 'string') {
                        errorMessage = error.error.detail;
                    } else if (error.error.detail?.message) {
                        errorMessage = error.error.detail.message;
                    } else if (error.error.message) {
                        errorMessage = error.error.message;
                    }
                }

                return throwError(() => new Error(errorMessage));
            })
        );
    }

    logout(): Observable<void> {
        const token = localStorage.getItem('token');
        if (token) {
            // We use 'from' to convert the Promise/Fetch or just standard Http
            // But headers act different in Angular Interceptors. 
            // We will implement TokenInterceptor separately, but for now specific call:
            return this.http.post<void>(`${API_URL}/superadmin/logout`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).pipe(
                tap(() => this.clearSession()),
                catchError(err => {
                    console.error('Logout error', err);
                    this.clearSession(); // Force clear anyway
                    return of(void 0);
                })
            );
        }
        this.clearSession();
        return of(void 0);
    }

    private setSession(authResult: AuthResponse) {
        localStorage.setItem('token', authResult.access_token);
        localStorage.setItem('user', JSON.stringify(authResult.user));
        this.currentUserSignal.set(authResult.user);
    }

    private clearSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSignal.set(null);
        this.router.navigate(['/login']);
    }
}
