import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { ApiConstants } from './api.constants';
import { ApiResponse } from './api-response.model';
import {
    Establecimiento,
    EstablecimientoCreate,
    EstablecimientoUpdate,
    EstablecimientoResponse,
    EstablecimientoListResponse
} from '../../domain/models/establecimiento.model';

@Injectable({
    providedIn: 'root'
})
export class EstablecimientosApiService extends BaseApiService {

    /**
     * Obtiene el listado de establecimientos con paginación opcional
     * @param limit - Cantidad de elementos por página (default: 100)
     * @param offset - Número de elementos a saltar (default: 0)
     * @param empresa_id - Filtrar por empresa (opcional)
     */
    listar(limit: number = 100, offset: number = 0, empresa_id?: string): Observable<Establecimiento[]> {
        let params = new HttpParams()
            .set('limit', limit.toString())
            .set('offset', offset.toString());

        if (empresa_id) {
            params = params.set('empresa_id', empresa_id);
        }

        return this.get<ApiResponse<Establecimiento[]>>(ApiConstants.ESTABLECIMIENTOS, params)
            .pipe(
                map(response => response.detalles || [])
            );
    }

    /**
     * Obtiene un establecimiento por su ID
     * @param id - UUID del establecimiento
     */
    obtenerPorId(id: string): Observable<Establecimiento> {
        const path = ApiConstants.ESTABLECIMIENTO_BY_ID.replace(':id', id);
        return this.get<ApiResponse<Establecimiento>>(path)
            .pipe(
                map(response => response.detalles)
            );
    }

    /**
     * Crea un nuevo establecimiento
     * @param datos - Datos del establecimiento a crear
     */
    crear(datos: EstablecimientoCreate): Observable<EstablecimientoResponse> {
        return this.post<ApiResponse<EstablecimientoResponse>>(
            ApiConstants.ESTABLECIMIENTOS,
            datos
        ).pipe(
            map(response => response.detalles)
        );
    }

    /**
     * Actualiza un establecimiento existente
     * @param id - UUID del establecimiento
     * @param datos - Datos a actualizar
     */
    actualizar(id: string, datos: EstablecimientoUpdate): Observable<EstablecimientoResponse> {
        const path = ApiConstants.ESTABLECIMIENTO_BY_ID.replace(':id', id);
        return this.put<ApiResponse<EstablecimientoResponse>>(path, datos)
            .pipe(
                map(response => response.detalles)
            );
    }

    /**
     * Elimina un establecimiento
     * @param id - UUID del establecimiento
     */
    eliminar(id: string): Observable<any> {
        const path = ApiConstants.ESTABLECIMIENTO_BY_ID.replace(':id', id);
        return this.delete<ApiResponse<any>>(path)
            .pipe(
                map(response => response.detalles)
            );
    }

    /**
     * Obtiene estadísticas de establecimientos (si aplica)
     */
    obtenerEstadisticas(): Observable<any> {
        return this.get<ApiResponse<any>>(`${ApiConstants.ESTABLECIMIENTOS}/stats`)
            .pipe(
                map(response => response.detalles)
            );
    }
}
