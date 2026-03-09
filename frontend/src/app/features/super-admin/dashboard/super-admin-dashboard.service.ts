import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { HorizontalBarData } from '../../../shared/components/horizontal-bar-card/horizontal-bar-card.component';

export interface DashboardKPIs {
  empresas_activas: number;
  ingresos_mensuales: number;
  comisiones_pendientes: number;
  pagos_atrasados: number;
  empresas_por_vencer: number;
  variacion_ingresos: number;
}

export interface DashboardAlerta {
  tipo: string;
  cantidad: number;
  nivel: 'critical' | 'warning' | 'info';
  mensaje: string;
}

export interface DashboardAlertas {
  criticas: DashboardAlerta[];
  advertencias: DashboardAlerta[];
  informativas: DashboardAlerta[];
}

export interface DashboardOverview {
  kpis: DashboardKPIs;
  alertas: DashboardAlertas;
  empresas_recientes: any[];
}

export interface ChartData {
  label: string;
  value: number;
  percent?: number;
  color?: string;
}

export interface DashboardGraficos {
  facturas_mes: ChartData[];
  ingresos_saas: ChartData[];
  empresas_by_plan: HorizontalBarData[];
  sri_trend: number[];
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private apiUrl = `${environment.apiUrl}/dashboards`;

  constructor(private http: HttpClient) { }

  getOverview(periodo: string = 'month'): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(`${this.apiUrl}/overview`, { params: { periodo } }).pipe(
      tap(data => console.log('[SuperAdminService] Raw Overview:', data))
    );
  }

  getCharts(periodo: string = 'month'): Observable<DashboardGraficos> {
    return this.http.get<DashboardGraficos>(`${this.apiUrl}/charts`, { params: { periodo } }).pipe(
      tap(data => console.log('[SuperAdminService] Raw Charts:', data))
    );
  }
}
