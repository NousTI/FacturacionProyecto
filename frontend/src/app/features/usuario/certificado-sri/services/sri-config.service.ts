import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { ConfigSRI, ActualizarParametrosSRI } from '../models/sri-config.model';
import { ApiResponse } from '../../../../../api/types';
import { map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class SriConfigService extends BaseApiService {
    private readonly endpoint = 'sri/configuracion';

    /**
     * Obtiene la configuración SRI de la empresa actual (basado en el token)
     */
    obtenerConfiguracion(): Observable<ConfigSRI | null> {
        return this.get<ApiResponse<ConfigSRI>>(this.endpoint).pipe(
            map(res => {
                if (!res.ok) {
                    throw new Error(res.mensaje || 'Error al obtener configuración');
                }
                return res.detalles;
            })
        );
    }

    /**
     * Sube el certificado digital y configura los parámetros iniciales
     * @param file Archivo .p12
     * @param password Contraseña del certificado
     * @param ambiente 'PRUEBAS' o 'PRODUCCION'
     * @param tipoEmision 'NORMAL' o 'CONTINGENCIA'
     */
    subirCertificado(
        file: File,
        password: string,
        ambiente: string = 'PRUEBAS',
        tipoEmision: string = 'NORMAL'
    ): Observable<ConfigSRI> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('password', password);
        formData.append('ambiente', ambiente);
        formData.append('tipo_emision', tipoEmision);

        return this.http.post<ApiResponse<ConfigSRI>>(`${this.apiUrl}/${this.endpoint}`, formData).pipe(
            map(res => {
                if (!res.ok) throw new Error(res.mensaje || 'Error al subir certificado');
                return res.detalles;
            })
        );
    }

    /**
     * Actualiza solo los parámetros de ambiente y tipo de emisión
     */
    actualizarParametros(params: ActualizarParametrosSRI): Observable<ConfigSRI | null> {
        return this.http.patch<ApiResponse<ConfigSRI>>(`${this.apiUrl}/${this.endpoint}/parametros`, params).pipe(
            map(res => {
                if (!res.ok) throw new Error(res.mensaje || 'Error al actualizar parámetros');
                return res.detalles;
            })
        );
    }
}
