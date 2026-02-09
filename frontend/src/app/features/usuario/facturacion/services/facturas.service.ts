
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
    Factura,
    FacturaCreacion,
    FacturaDetalle,
    FacturaDetalleCreacion,
    FacturaListadoFiltros
} from '../../../../domain/models/factura.model';

@Injectable({
    providedIn: 'root'
})
export class FacturasService {
    private apiUrl = `${environment.apiUrl}/facturas`;

    constructor(private http: HttpClient) { }

    // --- CRUD Básico ---
    crearFactura(datos: FacturaCreacion): Observable<Factura> {
        return this.http.post<Factura>(this.apiUrl, datos);
    }

    listarFacturas(params?: Partial<FacturaListadoFiltros>): Observable<Factura[]> {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                const value = (params as any)[key];
                if (value !== null && value !== undefined) {
                    httpParams = httpParams.append(key, value);
                }
            });
        }
        return this.http.get<Factura[]>(this.apiUrl, { params: httpParams });
    }

    obtenerFactura(id: string): Observable<Factura> {
        return this.http.get<Factura>(`${this.apiUrl}/${id}`);
    }

    actualizarFactura(id: string, datos: Partial<FacturaCreacion>): Observable<Factura> {
        return this.http.put<Factura>(`${this.apiUrl}/${id}`, datos);
    }

    eliminarFactura(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    anularFactura(id: string, razon: string): Observable<Factura> {
        return this.http.post<Factura>(`${this.apiUrl}/${id}/anular`, { razon_anulacion: razon });
    }

    // --- Detalles ---
    listarDetalles(facturaId: string): Observable<FacturaDetalle[]> {
        return this.http.get<FacturaDetalle[]>(`${this.apiUrl}/${facturaId}/detalles`);
    }

    obtenerDetalles(facturaId: string): Observable<FacturaDetalle[]> {
        return this.listarDetalles(facturaId);
    }

    agregarDetalle(facturaId: string, datos: FacturaDetalleCreacion): Observable<FacturaDetalle> {
        return this.http.post<FacturaDetalle>(`${this.apiUrl}/${facturaId}/detalles`, datos);
    }

    actualizarDetalle(detalleId: string, datos: Partial<FacturaDetalleCreacion>): Observable<FacturaDetalle> {
        return this.http.put<FacturaDetalle>(`${this.apiUrl}/detalles/${detalleId}`, datos);
    }

    eliminarDetalle(detalleId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/detalles/${detalleId}`);
    }

    // --- SRI Actions ---
    enviarSri(id: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${id}/enviar-sri`, {});
    }

    descargarPdf(id: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
    }

    enviarEmail(id: string, email?: string): Observable<any> {
        let params = new HttpParams();
        if (email) params = params.append('email_destino', email);
        return this.http.post<any>(`${this.apiUrl}/${id}/enviar-email`, {}, { params });
    }

    // --- Pagos ---
    registrarPago(facturaId: string, datos: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${facturaId}/pagos`, datos);
    }

    obtenerResumenPagos(facturaId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${facturaId}/pagos/resumen`);
    }

    listarPagos(facturaId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${facturaId}/pagos`);
    }
}
