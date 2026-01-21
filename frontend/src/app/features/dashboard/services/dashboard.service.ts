import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
}

// Chart interfaces
export interface ChartData {
    label: string;
    value: number;
}

export interface DashboardGraficos {
    facturas_mes: ChartData[];
    ingresos_saas: ChartData[];
    empresas_by_plan: any[]; // The generic one from backend was List[Dict]
    sri_trend: number[];
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${environment.apiUrl}/dashboard`;

    constructor(private http: HttpClient) { }

    getOverview(): Observable<DashboardOverview> {
        return this.http.get<DashboardOverview>(`${this.apiUrl}/overview`);
    }

    getKPIs(): Observable<DashboardKPIs> {
        return this.http.get<DashboardKPIs>(`${this.apiUrl}/kpis`);
    }

    getAlertas(): Observable<DashboardAlertas> {
        return this.http.get<DashboardAlertas>(`${this.apiUrl}/alertas`);
    }

    // To fulfill "getIngresosMensuales" and "getEmpresasPorPlan" using existing backend logic
    // We'll use the legacy-compatible /charts endpoint which returns all this data
    getChartsData(): Observable<DashboardGraficos> {
        return this.http.get<DashboardGraficos>(`${this.apiUrl}/charts`);
    }
}
