import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { NotaCredito, ResultadoEmisionNC } from '../../../../domain/models/nota-credito.model';

@Injectable({
  providedIn: 'root'
})
export class NotasCreditoService {
  private apiUrl = `${environment.apiUrl}/notas-credito`;

  constructor(private http: HttpClient) { }

  /**
   * Proceso principal: Genera NC y emite al SRI para anular factura
   */
  anularFacturaConNC(facturaId: string, motivo: string): Observable<ResultadoEmisionNC> {
    const params = new HttpParams().set('motivo', motivo);
    return this.http.post<ResultadoEmisionNC>(
      `${this.apiUrl}/anular-factura/${facturaId}`, 
      {}, 
      { params }
    );
  }

  /**
   * Reintenta el envío de una NC fallida
   */
  reintentarEmision(ncId: string): Observable<ResultadoEmisionNC> {
    return this.http.post<ResultadoEmisionNC>(`${this.apiUrl}/${ncId}/reintentar`, {});
  }

  /**
   * Consulta el estado actual en el SRI
   */
  consultarEstadoSri(ncId: string): Observable<ResultadoEmisionNC> {
    return this.http.get<ResultadoEmisionNC>(`${this.apiUrl}/${ncId}/consultar-sri`);
  }

  /**
   * Obtiene el listado de NCs
   */
  listarNotasCredito(params?: any): Observable<NotaCredito[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.append(key, params[key]);
        }
      });
    }
    return this.http.get<NotaCredito[]>(this.apiUrl, { params: httpParams });
  }

  /**
   * Obtiene detalle de una NC específica
   */
  obtenerNotaCredito(id: string): Observable<NotaCredito> {
    return this.http.get<NotaCredito>(`${this.apiUrl}/${id}`);
  }
}
