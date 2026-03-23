import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CuentasCobrarOverview, CuentasCobrarFiltros } from '../../../../domain/models/cuentas-cobrar.model';

@Injectable({
  providedIn: 'root'
})
export class CuentasCobrarService {
  private apiUrl = `${environment.apiUrl}/cuentas-cobrar`;

  constructor(private http: HttpClient) { }

  getResumen(filtros: CuentasCobrarFiltros): Observable<CuentasCobrarOverview> {
    let params = new HttpParams();
    if (filtros.fecha_corte) params = params.set('fecha_corte', filtros.fecha_corte);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.cliente_id) params = params.set('cliente_id', filtros.cliente_id);

    return this.http.get<CuentasCobrarOverview>(`${this.apiUrl}/resumen`, { params });
  }

  // Otros métodos CRUD si fueran necesarios en el futuro
}
