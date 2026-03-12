import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardKPIs {
    empresas_activas: number;
    ingresos_mensuales: number;
    comisiones_pendientes: number;
    pagos_atrasados: number;
    empresas_por_vencer: number;
    variacion_ingresos: number;
    firma_expiracion_dias?: number;
    ventas_periodo?: number;
    ventas_hoy?: number;
    cuentas_cobrar?: number;
    productos_stock_bajo?: number;
    facturas_rechazadas?: number;
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
    consumo_plan?: { actual: number; limite: number };
    top_productos?: any[];
    firma_info?: { fecha: string; dias_restantes: number };
    facturas_recientes?: any[];
}



// Chart interfaces
export interface ChartData {
    label: string;
    value: number;
}

export interface DashboardGraficos {
    facturas_mes: ChartData[];
    ingresos_saas: ChartData[];
    empresas_by_plan: any[];
    sri_trend: number[];
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${environment.apiUrl}/dashboards`;


    constructor(private http: HttpClient) { }

    getOverview(periodo: string = 'month'): Observable<DashboardOverview> {
        return this.http.get<DashboardOverview>(`${this.apiUrl}/overview`, { params: { periodo } });
    }

    getKPIs(periodo: string = 'month'): Observable<DashboardKPIs> {
        return this.http.get<DashboardKPIs>(`${this.apiUrl}/kpis`, { params: { periodo } });
    }

    getAlertas(): Observable<DashboardAlertas> {
        return this.http.get<DashboardAlertas>(`${this.apiUrl}/alertas`);
    }

    getChartsData(periodo: string = 'month'): Observable<DashboardGraficos> {
        return this.http.get<DashboardGraficos>(`${this.apiUrl}/charts`, { params: { periodo } });
    }
}

