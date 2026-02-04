import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';

export interface ClienteUsuario {
    id: string;
    user_id: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    empresa_id: string;
    empresa_nombre?: string;
    empresa_rol_id: string;
    rol_nombre?: string;
    activo: boolean;
    ultimo_acceso?: string;
    created_at: string;
    // Add any missing fields from page expectation
    nombre?: string; // Some parts use .nombre (concatenated)
    vendedor_id?: string;
    origen_creacion?: string;
}

export type Cliente = ClienteUsuario;

export interface ClienteStats {
    total: number;
    activos: number;
    inactivos: number;
}

export interface ClienteConTrazabilidad extends ClienteUsuario {
    creado_por_nombre?: string;
    creado_por_email?: string;
    creado_por_rol?: string;
    origen_creacion?: 'superadmin' | 'vendedor' | 'sistema';
    fecha_creacion_log?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClientesService {
    private apiUrl = `${environment.apiUrl}/usuarios/admin`;

    private _clientes$ = new BehaviorSubject<Cliente[]>([]);
    public clientes$ = this._clientes$.asObservable();

    private _stats$ = new BehaviorSubject<ClienteStats | null>(null);
    public stats$ = this._stats$.asObservable();

    private _loading$ = new BehaviorSubject<boolean>(false);
    public loading$ = this._loading$.asObservable();

    constructor(private http: HttpClient) { }

    fetchClientes(vendedorId?: string): void {
        this._loading$.next(true);
        let url = `${this.apiUrl}/lista`;
        if (vendedorId) url += `?vendedor_id=${vendedorId}`;

        this.http.get<any>(url).pipe(
            map(res => res.detalles as Cliente[]),
            tap(clientes => this._clientes$.next(clientes)),
            tap(() => this._loading$.next(false))
        ).subscribe();
    }

    getClientes(vendedorId?: string): Observable<Cliente[]> {
        let url = `${this.apiUrl}/lista`;
        if (vendedorId) url += `?vendedor_id=${vendedorId}`;
        return this.http.get<any>(url).pipe(
            map(res => res.detalles as Cliente[])
        );
    }

    fetchStats(): void {
        this.http.get<any>(`${this.apiUrl}/stats`).pipe(
            map(res => res.detalles as ClienteStats),
            tap(stats => this._stats$.next(stats))
        ).subscribe();
    }

    getStats(): Observable<ClienteStats> {
        return this.http.get<any>(`${this.apiUrl}/stats`).pipe(
            map(res => res.detalles as ClienteStats)
        );
    }

    crearCliente(datos: any): Observable<Cliente> {
        // Point to base usuarios endpoint
        const baseUrl = this.apiUrl.replace('/admin', '');
        return this.http.post<any>(baseUrl, datos).pipe(
            map(res => res.detalles as Cliente),
            tap(nuevo => {
                const current = this._clientes$.value;
                this._clientes$.next([nuevo, ...current]);
                this.fetchStats();
            })
        );
    }

    eliminarCliente(id: string): Observable<boolean> {
        // Point to base usuarios endpoint
        const baseUrl = this.apiUrl.replace('/admin', '');
        return this.http.delete<any>(`${baseUrl}/${id}`).pipe(
            map(res => res.success),
            tap(success => {
                if (success) {
                    const current = this._clientes$.value.filter(c => c.id !== id);
                    this._clientes$.next(current);
                    this.fetchStats();
                }
            })
        );
    }

    getClienteDetalle(id: string): Observable<ClienteConTrazabilidad> {
        // We can use the admin list or profile endpoint, but base /id might work if it returns full data
        const baseUrl = this.apiUrl.replace('/admin', '');
        return this.http.get<any>(`${baseUrl}/${id}`).pipe(
            map(res => res.detalles as ClienteConTrazabilidad)
        );
    }

    actualizarCliente(id: string, datos: Partial<Cliente>): Observable<Cliente> {
        const baseUrl = this.apiUrl.replace('/admin', '');
        return this.http.patch<any>(`${baseUrl}/${id}`, datos).pipe(
            map(res => res.detalles as Cliente),
            tap(() => this.fetchClientes()) // Reload list
        );
    }

    toggleStatus(id: string): Observable<Cliente> {
        return this.http.patch<any>(`${this.apiUrl}/${id}/toggle-status`, {}).pipe(
            map(res => res.detalles as Cliente),
            tap(() => this.fetchClientes()) // Reload list
        );
    }

    reasignarEmpresa(id: string, nuevaEmpresaId: string): Observable<Cliente> {
        return this.http.patch<any>(`${this.apiUrl}/${id}/reasignar-empresa?nueva_empresa_id=${nuevaEmpresaId}`, {}).pipe(
            map(res => res.detalles as Cliente),
            tap(() => this.fetchClientes()) // Reload list
        );
    }
}
