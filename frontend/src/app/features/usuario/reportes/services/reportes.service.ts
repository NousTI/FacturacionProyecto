
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Reporte, ReporteCreacion } from '../../../../domain/models/reporte.model';

@Injectable({
    providedIn: 'root'
})
export class ReportesService {
    private apiUrl = `${environment.apiUrl}/reportes`;

    constructor(private http: HttpClient) { }

    listarReportes(): Observable<Reporte[]> {
        return this.http.get<Reporte[]>(this.apiUrl);
    }

    generarReporte(datos: ReporteCreacion): Observable<Reporte> {
        return this.http.post<Reporte>(this.apiUrl, datos);
    }

    obtenerReporte(id: string): Observable<Reporte> {
        return this.http.get<Reporte>(`${this.apiUrl}/${id}`);
    }

    eliminarReporte(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    obtenerPreview(datos: ReporteCreacion): Observable<any[]> {
        return this.http.post<any[]>(`${this.apiUrl}/preview`, datos);
    }
}
