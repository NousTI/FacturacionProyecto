import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PerfilService {
    private apiUrl = `${environment.apiUrl}/superadmin/perfil`;

    private _perfil$ = new BehaviorSubject<any>(null);

    constructor(private http: HttpClient) { }

    getPerfil(): Observable<any> {
        return this._perfil$.asObservable();
    }

    loadPerfil() {
        // Placeholder for actual implementation
        // this.http.get<any>(this.apiUrl).subscribe(perfil => {
        //   this._perfil$.next(perfil);
        // });

        // Mock data for UI development
        this._perfil$.next({
            id: 'mock-id',
            email: 'admin@nousti.com',
            nombres: 'Super',
            apellidos: 'Administrador',
            role: 'SUPERADMIN',
            estado: 'ACTIVA',
            activo: true,
            ultimo_acceso: new Date().toISOString(),
            created_at: new Date('2024-01-01').toISOString(),
            updated_at: new Date().toISOString()
        });
    }

    updatePerfil(data: any): Observable<any> {
        return this.http.patch<any>(this.apiUrl, data);
    }
}
