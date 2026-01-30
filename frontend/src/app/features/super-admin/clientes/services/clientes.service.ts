import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface ClienteUsuario {
    id: string;
    nombre: string;
    email: string;
    role: string;
    empresa_id: string;
    empresa_nombre: string;
    vendedor_id?: string;
    vendedor_nombre?: string;
    creado_por_id: string;
    creado_por_nombre: string;
    creado_por_role: string;
    estado: 'ACTIVO' | 'INACTIVO';
    fecha_registro: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClientesService {
    private mockClientes: ClienteUsuario[] = [
        {
            id: 'u1',
            nombre: 'Juan Pérez',
            email: 'juan.perez@empresa-alpha.com',
            role: 'ADMIN',
            empresa_id: 'e1',
            empresa_nombre: 'Empresa Alpha',
            vendedor_id: 'v1',
            vendedor_nombre: 'Carlos Vendedor',
            creado_por_id: 'v1',
            creado_por_nombre: 'Carlos Vendedor',
            creado_por_role: 'VENDEDOR',
            estado: 'ACTIVO',
            fecha_registro: '2024-01-15T10:30:00Z'
        },
        {
            id: 'u2',
            nombre: 'Maria García',
            email: 'maria.garcia@empresa-alpha.com',
            role: 'CONTADOR',
            empresa_id: 'e1',
            empresa_nombre: 'Empresa Alpha',
            creado_por_id: 'u1',
            creado_por_nombre: 'Juan Pérez',
            creado_por_role: 'ADMIN_EMPRESA',
            estado: 'ACTIVO',
            fecha_registro: '2024-02-01T14:20:00Z'
        },
        {
            id: 'u3',
            nombre: 'Roberto Gómez',
            email: 'roberto@logistica-beta.com',
            role: 'ADMIN',
            empresa_id: 'e2',
            empresa_nombre: 'Logística Beta',
            vendedor_id: 'v2',
            vendedor_nombre: 'Ana Ventas',
            creado_por_id: 'v2',
            creado_por_nombre: 'Ana Ventas',
            creado_por_role: 'VENDEDOR',
            estado: 'ACTIVO',
            fecha_registro: '2024-01-20T09:00:00Z'
        },
        {
            id: 'u4',
            nombre: 'Elena Soto',
            email: 'elena.soto@empresa-alpha.com',
            role: 'AUXILIAR',
            empresa_id: 'e1',
            empresa_nombre: 'Empresa Alpha',
            creado_por_id: 'u2',
            creado_por_nombre: 'Maria García',
            creado_por_role: 'COLABORADOR',
            estado: 'ACTIVO',
            fecha_registro: '2024-02-15T11:45:00Z'
        }
    ];

    getClientes(): Observable<ClienteUsuario[]> {
        return of(this.mockClientes).pipe(delay(500));
    }

    getStats(): Observable<any> {
        return of({
            total: 154,
            activos: 142,
            nuevos_mes: 28
        }).pipe(delay(300));
    }
}
