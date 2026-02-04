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
}
