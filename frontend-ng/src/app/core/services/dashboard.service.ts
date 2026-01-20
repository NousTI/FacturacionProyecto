import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardSummary {
    total_empresas: number;
    empresas_activas: number;
    empresas_inactivas: number;
    total_usuarios: number;
    total_facturas: number | string;
    ingresos_totales: number;
    comisiones_pendientes_monto: number;
    comisiones_pendientes_count: number;
    errores_sri_msg: string;
    certificados_msg: string;
    // Trend strings if provided
    trend_empresas?: string;
    trend_usuarios?: string;
    trend_facturas?: string;
    trend_ingresos?: string;
}

export interface ChartData {
    facturas_mes: { label: string, value: number }[];
    ingresos_saas: { label: string, value: number }[];
    empresas_by_plan: { name: string, count: number, percent: number, color: string }[];
    sri_trend: number[];
}

import { AppConfig } from '../config/app.config';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);
    private apiUrl = `${AppConfig.apiUrl}/dashboard`;

    getSummary(): Observable<DashboardSummary> {
        return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
    }

    getCharts(): Observable<ChartData> {
        return this.http.get<ChartData>(`${this.apiUrl}/charts`);
    }
}
