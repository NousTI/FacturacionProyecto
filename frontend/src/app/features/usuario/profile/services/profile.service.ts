import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { PerfilUsuario } from '../../../../domain/models/perfil.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class ProfileService extends BaseApiService {
    private readonly ENDPOINT = 'usuarios/perfil';

    // Caching State
    private _perfil$ = new BehaviorSubject<PerfilUsuario | null>(null);
    private _loading$ = new BehaviorSubject<boolean>(false);
    private _loaded = false;

    constructor(http: HttpClient) {
        super(http);
    }

    // Getters for the state
    get perfil$() { return this._perfil$.asObservable(); }
    get loading$() { return this._loading$.asObservable(); }

    /**
     * Loads profile data from API and updates local cache
     * @param force - if true, bypasses cache and fetches again
     */
    loadProfile(force: boolean = false): void {
        if (this._loaded && !force) return;

        this._loading$.next(true);
        this.get<ApiResponse<PerfilUsuario>>(this.ENDPOINT).subscribe({
            next: (resp) => {
                if (resp && resp.detalles) {
                    this._perfil$.next(resp.detalles);
                    this._loaded = true;
                }
                this._loading$.next(false);
            },
            error: () => {
                this._loading$.next(false);
            }
        });
    }

    /**
     * Clears the profile cache (e.g. on logout)
     */
    clearCache(): void {
        this._perfil$.next(null);
        this._loaded = false;
    }

    /**
     * Forces a refresh from the server
     */
    refresh(): void {
        this.loadProfile(true);
    }

    /**
     * Updates user's profile info (nombres, apellidos, telefono only)
     */
    updateProfile(data: { nombres: string, apellidos: string, telefono: string }): Observable<any> {
        // According to routes.js, the update endpoint for a user inside an empresa needs the user's UUID.
        // Wait, routes.py has: PATCH /usuarios/{id}
        // Let's check how the current user retrieves their id.
        // The endpoint GET /perfil works without ID, but there is no PATCH /perfil.
        // Wait, looking at the backend, there is no PATCH /perfil for the user. We must use PATCH /usuarios/{id}
        // or we need to add a PATCH /perfil in the backend. 
        // Let's add the PATCH /perfil to the backend to make it smooth, or just grab the ID from the current profile.
        const currentProfile = this._perfil$.getValue();
        if (!currentProfile || !currentProfile.id) {
            throw new Error('No profile loaded');
        }
        return this.patch<any>(`usuarios/${currentProfile.id}`, data).pipe(
            tap(() => this.refresh())
        );
    }

    /**
     * Updates user's password
     */
    updatePassword(nueva_password: string): Observable<any> {
        return this.patch<any>(`usuarios/perfil/password`, { nueva_password }).pipe(
            tap(() => this.refresh())
        );
    }
}
