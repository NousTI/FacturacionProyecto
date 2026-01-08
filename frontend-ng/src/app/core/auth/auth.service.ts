import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';

// TODO: Move to environments
const API_URL = 'http://localhost:8000/api';

export type UserRole = 'usuario' | 'vendedor' | 'superadmin';

export interface BaseUser {
    id: string; // UUID
    email: string;
    nombres: string;
    apellidos: string;
    activo: boolean;
    created_at: string;
    updated_at: string;
    last_login: string | null;
    role: UserRole; // Helper for frontend logic
}

export interface Superadmin extends BaseUser {
    role: 'superadmin';
}

export interface Vendedor extends BaseUser {
    role: 'vendedor';
    telefono?: string;
    documento_identidad?: string;
    porcentaje_comision?: number;
    tipo_comision?: string;
}

export interface Usuario extends BaseUser {
    role: 'usuario';
    telefono?: string;
    empresa_id?: string;
    rol_id?: string;
    avatar_url?: string;
    requiere_cambio_password?: boolean;
}

export type User = Superadmin | Vendedor | Usuario;

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

    // Helpers to easily check role in templates
    readonly isSuperadmin = computed(() => this.currentUserSignal()?.role === 'superadmin');
    readonly isVendedor = computed(() => this.currentUserSignal()?.role === 'vendedor');
    readonly isUsuario = computed(() => this.currentUserSignal()?.role === 'usuario');

    constructor() {
        this.restoreSession();
    }

    private restoreSession(): void {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            try {
                const user = JSON.parse(storedUser);
                this.currentUserSignal.set(user);

                // Verify session validity with backend
                this.verifySession(user.role);
            } catch (e) {
                this.clearSession();
            }
        }
    }

    private verifySession(role: UserRole): void {
        let endpoint = '';
        switch (role) {
            case 'superadmin':
                endpoint = `${API_URL}/auth/superadmin/me`;
                break;
            case 'vendedor':
                endpoint = `${API_URL}/auth/vendedor/me`;
                break;
            case 'usuario':
            default:
                endpoint = `${API_URL}/auth/usuario/me`;
                break;
        }

        this.http.get(endpoint).subscribe({
            next: (userData: any) => {
                // Update session state with fresh data from backend
                console.log('Session verified, updating user data');
                this.currentUserSignal.set(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            },
            error: (err) => {
                console.warn('Session invalid, logging out', err);
                this.clearSession();
            }
        });
    }

    login(credentials: { email: string; password: string }, role: UserRole): Observable<User> {
        let endpoint = '';

        switch (role) {
            case 'superadmin':
                endpoint = `${API_URL}/auth/superadmin/login`;
                break;
            case 'vendedor':
                endpoint = `${API_URL}/auth/vendedor/login`;
                break;
            case 'usuario':
            default:
                endpoint = `${API_URL}/auth/usuario/login`;
                break;
        }

        return this.http.post<any>(endpoint, credentials).pipe(
            map(response => {
                // Determine structure: sometimes data is nested, sometimes flat depending on endpoint consistency
                // We assume consistent: { data: { access_token, user, ... } }
                // or direct: { access_token, user }
                const authData = response.data || response;

                // Inject role into user object for frontend persistence
                // Backend usually sends it, but ensuring it matches request role is good practice
                if (authData.user) {
                    authData.user.role = role;
                }
                return authData;
            }),
            tap((data: AuthResponse) => {
                this.setSession(data);
            }),
            map(data => data.user as User),
            catchError(error => {
                let errorMessage = 'Error al iniciar sesión';

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
        const user = this.currentUserSignal();

        if (token && user) {
            let endpoint = '';
            switch (user.role) {
                case 'superadmin':
                    endpoint = `${API_URL}/auth/superadmin/logout`;
                    break;
                case 'vendedor':
                    endpoint = `${API_URL}/auth/vendedor/logout`;
                    break;
                case 'usuario':
                default:
                    endpoint = `${API_URL}/auth/usuario/logout`;
                    break;
            }

            return this.http.post<void>(endpoint, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).pipe(
                tap(() => this.clearSession()),
                catchError(err => {
                    console.error('Logout error', err);
                    this.clearSession();
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
