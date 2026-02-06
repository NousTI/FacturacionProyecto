import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { ApiConstants } from './api.constants';
import { ApiResponse } from './api-response.model';
import {
    PuntoEmision,
    PuntoEmisionCreate,
    PuntoEmisionUpdate,
    PuntoEmisionResponse,
    PuntoEmisionListResponse
} from '../../domain/models/punto-emision.model';

@Injectable({
    providedIn: 'root'
})
export class PuntosEmisionApiService extends BaseApiService {

    /**
     * Obtiene el listado de puntos de emisión con paginación opcional
     * @param limit - Cantidad de elementos por página (default: 100)
     * @param offset - Número de elementos a saltar (default: 0)
     * @param establecimiento_id - Filtrar por establecimiento (opcional)
     */
    listar(limit: number = 100, offset: number = 0, establecimiento_id?: string): Observable<PuntoEmision[]> {
        let params = new HttpParams()
            .set('limit', limit.toString())
            .set('offset', offset.toString());

        if (establecimiento_id) {
            params = params.set('establecimiento_id', establecimiento_id);
        }

        return this.get<ApiResponse<PuntoEmision[]>>(ApiConstants.PUNTOS_EMISION, params)
            .pipe(
                map(response => response.detalles || [])
            );
    }

    /**
     * Obtiene un punto de emisión por su ID
     * @param id - UUID del punto de emisión
     */
    obtenerPorId(id: string): Observable<PuntoEmision> {
        const path = ApiConstants.PUNTO_EMISION_BY_ID.replace(':id', id);
        return this.get<ApiResponse<PuntoEmision>>(path)
            .pipe(
                map(response => response.detalles)
            );
    }

    /**
     * Crea un nuevo punto de emisión
     * @param datos - Datos del punto de emisión a crear
     */
    crear(datos: PuntoEmisionCreate): Observable<PuntoEmisionResponse> {
        return this.post<ApiResponse<PuntoEmisionResponse>>(
            ApiConstants.PUNTOS_EMISION,
            datos
        ).pipe(
            map(response => response.detalles)
        );
    }

    /**
     * Actualiza un punto de emisión existente
     * @param id - UUID del punto de emisión
     * @param datos - Datos a actualizar
     */
    actualizar(id: string, datos: PuntoEmisionUpdate): Observable<PuntoEmisionResponse> {
        const path = ApiConstants.PUNTO_EMISION_BY_ID.replace(':id', id);
        return this.put<ApiResponse<PuntoEmisionResponse>>(path, datos)
            .pipe(
                map(response => response.detalles)
            );
    }

    /**
     * Elimina un punto de emisión
     * @param id - UUID del punto de emisión
     */
    eliminar(id: string): Observable<any> {
        const path = ApiConstants.PUNTO_EMISION_BY_ID.replace(':id', id);
        return this.delete<ApiResponse<any>>(path)
            .pipe(
                map(response => response.detalles)
            );
    }

    /**
     * Obtiene estadísticas de puntos de emisión (si aplica)
     */
    obtenerEstadisticas(): Observable<any> {
        return this.get<ApiResponse<any>>(`${ApiConstants.PUNTOS_EMISION}/stats`)
            .pipe(
                map(response => response.detalles)
            );
    }

    /**
     * Obtiene los puntos de emisión de un establecimiento específico
     * @param establecimiento_id - UUID del establecimiento
     */
    obtenerPorEstablecimiento(establecimiento_id: string): Observable<PuntoEmision[]> {
        return this.listar(100, 0, establecimiento_id);
    }
}
