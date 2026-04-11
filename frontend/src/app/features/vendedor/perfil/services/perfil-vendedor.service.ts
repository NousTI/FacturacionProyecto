
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../../core/api/api-response.model';

export interface VendedorPerfil {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
    identificacion: string;
    porcentaje_comision_inicial: number;
    porcentaje_comision_recurrente: number;
    tipo_comision: string;
    puede_crear_empresas: boolean;
    puede_gestionar_planes: boolean;
    puede_acceder_empresas: boolean;
    puede_ver_reportes: boolean;
    activo: boolean;
    fecha_registro: string;
    empresas_asignadas: number;
    ingresos_generados: number;
    requiere_cambio_password?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class VendedorPerfilService {
    private apiUrl = `${environment.apiUrl}/vendedores/me`;

    constructor(private http: HttpClient) { }

    obtenerPerfil(): Observable<VendedorPerfil> {
        return this.http.get<ApiResponse<VendedorPerfil>>(this.apiUrl).pipe(
            tap(response => console.log('Respuesta raw perfil vendedor:', response)),
            map(response => {
                if (!response.ok) {
                    throw new Error(response.mensaje || 'Error al obtener perfil');
                }
                console.log('Detalles perfil extraídos:', response.detalles);
                return response.detalles;
            })
        );
    }

    actualizarPerfil(datos: { nombres?: string; apellidos?: string; telefono?: string }): Observable<VendedorPerfil> {
        return this.http.patch<ApiResponse<VendedorPerfil>>(this.apiUrl, datos).pipe(
            map(response => {
                if (!response.ok) {
                    throw new Error(response.mensaje || 'Error al actualizar perfil');
                }
                return response.detalles;
            })
        );
    }

    updatePassword(nueva_password: string): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/password`, { nueva_password });
    }
}
