import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { 
    CuentasCobrarOverview, CuentasCobrarFiltros, 
    AntiguedadCliente, ClienteMoroso, HistorialPago, ProyeccionCobro 
} from '../../../../domain/models/cuentas-cobrar.model';

@Injectable({
  providedIn: 'root'
})
export class CuentasCobrarService {
  private apiUrl = `${environment.apiUrl}/cuentas-cobrar`;

  constructor(private http: HttpClient) { }

  getResumen(filtros: CuentasCobrarFiltros): Observable<CuentasCobrarOverview> {
    let params = this.buildParams(filtros);
    return this.http.get<CuentasCobrarOverview>(`${this.apiUrl}/resumen`, { params });
  }

  getAntiguedadClientes(fecha_corte?: string): Observable<AntiguedadCliente[]> {
    let params = new HttpParams();
    if (fecha_corte) params = params.set('fecha_corte', fecha_corte);
    return this.http.get<AntiguedadCliente[]>(`${this.apiUrl}/antiguedad-clientes`, { params });
  }

  getClientesMorosos(dias_mora: number = 1): Observable<ClienteMoroso[]> {
    let params = new HttpParams().set('dias_mora', dias_mora.toString());
    return this.http.get<ClienteMoroso[]>(`${this.apiUrl}/morosos`, { params });
  }

  getHistorialPagos(filtros: CuentasCobrarFiltros): Observable<HistorialPago[]> {
     let params = new HttpParams();
     if (filtros.fecha_inicio) params = params.set('inicio', filtros.fecha_inicio);
     if (filtros.fecha_fin) params = params.set('fin', filtros.fecha_fin);
     if (filtros.cliente_id) params = params.set('cliente_id', filtros.cliente_id);
     return this.http.get<HistorialPago[]>(`${this.apiUrl}/pagos`, { params });
  }

  getProyeccionCobros(): Observable<ProyeccionCobro[]> {
     return this.http.get<ProyeccionCobro[]>(`${this.apiUrl}/proyeccion`);
  }

  private buildParams(filtros: CuentasCobrarFiltros): HttpParams {
    let params = new HttpParams();
    if (filtros.fecha_corte) params = params.set('fecha_corte', filtros.fecha_corte);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.cliente_id) params = params.set('cliente_id', filtros.cliente_id);
    return params;
  }
}
