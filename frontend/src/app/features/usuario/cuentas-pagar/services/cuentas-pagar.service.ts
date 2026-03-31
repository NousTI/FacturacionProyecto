import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { 
  CuentasPagarOverview, ReporteGastosCategoria, 
  GastoProveedorDetalle, ReporteFlujoCaja, CuentasPagarFiltros 
} from '../../../../domain/models/cuentas-pagar.model';

@Injectable({
  providedIn: 'root'
})
export class CuentasPagarService {
  private readonly apiUrl = `${environment.apiUrl}/cuentas-pagar`;

  constructor(private http: HttpClient) {}

  getResumen(): Observable<CuentasPagarOverview> {
    return this.http.get<CuentasPagarOverview>(`${this.apiUrl}/resumen`);
  }

  getGastosPorCategoria(filtros: CuentasPagarFiltros): Observable<ReporteGastosCategoria> {
    let params = new HttpParams();
    if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    return this.http.get<ReporteGastosCategoria>(`${this.apiUrl}/por-categoria`, { params });
  }

  getGastosPorProveedor(filtros: CuentasPagarFiltros): Observable<GastoProveedorDetalle[]> {
    let params = new HttpParams();
    if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    return this.http.get<GastoProveedorDetalle[]>(`${this.apiUrl}/por-proveedor`, { params });
  }

  getFlujoCaja(filtros: CuentasPagarFiltros): Observable<ReporteFlujoCaja> {
    let params = new HttpParams();
    if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    if (filtros.agrupacion) params = params.set('agrupacion', filtros.agrupacion);
    return this.http.get<ReporteFlujoCaja>(`${this.apiUrl}/flujo-caja`, { params });
  }
}
