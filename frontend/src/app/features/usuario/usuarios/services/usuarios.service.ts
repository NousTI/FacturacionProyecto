import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, finalize, from } from 'rxjs';
import { http } from '../../../../../api/http';
import { API_ENDPOINTS } from '../../../../../api/endpoint';
import { ApiResponse } from '../../../../../api/types';
import { User } from '../../../../domain/models/user.model';

export interface UsuariosStats {
    total: number;
    activos: number;
    inactivos: number;
}

@Injectable({
    providedIn: 'root'
})
export class UsuariosService {
    private usuariosSubject = new BehaviorSubject<User[]>([]);
    public usuarios$ = this.usuariosSubject.asObservable();

    private statsSubject = new BehaviorSubject<UsuariosStats>({ total: 0, activos: 0, inactivos: 0 });
    public stats$ = this.statsSubject.asObservable();

    constructor() { }

    loadInitialData() {
        this.refresh();
    }

    refresh() {
        this.listarUsuarios().subscribe();
    }

    listarUsuarios(): Observable<User[]> {
        return from(http.get<ApiResponse<User[]>>(API_ENDPOINTS.USUARIOS.BASE)).pipe(
            map(res => res.data.detalles),
            tap(users => {
                this.usuariosSubject.next(users);
                this.calculateStats(users);
            })
        );
    }

    obtenerUsuario(id: string): Observable<User> {
        return from(http.get<ApiResponse<User>>(`${API_ENDPOINTS.USUARIOS.BASE}/${id}`)).pipe(
            map(res => res.data.detalles)
        );
    }

    private calculateStats(users: User[]) {
        const stats: UsuariosStats = {
            total: users.length,
            activos: users.filter(u => u.activo !== false).length,
            inactivos: users.filter(u => u.activo === false).length
        };
        this.statsSubject.next(stats);
    }

    createUsuario(data: any): Observable<User> {
        return from(http.post<ApiResponse<User>>(API_ENDPOINTS.USUARIOS.BASE, data)).pipe(
            map(res => res.data.detalles),
            tap(newUser => {
                const current = this.usuariosSubject.value;
                this.usuariosSubject.next([...current, newUser]);
                this.calculateStats(this.usuariosSubject.value);
            })
        );
    }

    updateUsuario(id: string, data: any): Observable<User> {
        return from(http.patch<ApiResponse<User>>(`${API_ENDPOINTS.USUARIOS.BASE}/${id}`, data)).pipe(
            map(res => res.data.detalles),
            tap(updatedUser => {
                const current = this.usuariosSubject.value;
                const index = current.findIndex(u => u.id === id);
                if (index !== -1) {
                    current[index] = updatedUser;
                    this.usuariosSubject.next([...current]);
                    this.calculateStats(current);
                }
            })
        );
    }

    deleteUsuario(id: string): Observable<void> {
        return from(http.delete<ApiResponse<void>>(`${API_ENDPOINTS.USUARIOS.BASE}/${id}`)).pipe(
            map(() => {
                const current = this.usuariosSubject.value;
                const filtered = current.filter(u => u.id !== id);
                this.usuariosSubject.next(filtered);
                this.calculateStats(filtered);
            })
        );
    }

    // --- ROLES Y PERMISOS ---
    listarRoles(): Observable<any[]> {
        return from(http.get<ApiResponse<any[]>>(API_ENDPOINTS.ROLES.BASE)).pipe(
            map(res => res.data.detalles)
        );
    }

    getPermisosCatalog(): Observable<any[]> {
        return from(http.get<ApiResponse<any[]>>(API_ENDPOINTS.ROLES.PERMISOS)).pipe(
            map(res => res.data.detalles)
        );
    }
}
