import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

export interface PyGReport {
  periodo: { inicio: string; fin: string };
  estructura: {
    ingresos: {
      ventas: number;
      descuentos: number;
      ingresos_netos: number;
    };
    costos_y_gastos: {
      costo_de_ventas: number;
      utilidad_bruta: number;
      gastos_operativos: any;
      utilidad_operacional: number;
      otros_ingresos: number;
      gastos_financieros: number;
    };
    utilidad_neta: number;
  };
}

export interface IVAReport {
  periodo: { inicio: string; fin: string };
  ventas: {
    tarifa_0: number;
    tarifa_15: number;
    base_imponible_15: number;
    iva_cobrado_15: number;
  };
  compras: {
    nota: string;
    tarifa_0: number;
    tarifa_15: number;
    iva_pagado_15: number;
  };
  resumen: {
    iva_cobrado: number;
    iva_pagado: number;
    iva_a_pagar: number;
  };
}

export interface ExecutiveSummary {
  periodo: { inicio: string; fin: string };
  ventas: {
    total_facturado: number;
    variacion_porcentual: number;
    facturas_emitidas: number;
    variacion_facturas: number;
    ticket_promedio: number;
    variacion_ticket: number;
    clientes_activos: number;
  };
  cobros: {
    total_cobrado: number;
    pendiente_cobro: number;
    porcentaje_recuperacion: number;
  };
  gastos: {
    nota: string;
    total_gastos: number;
  };
  utilidad: {
    utilidad_bruta: number;
    margen_bruto: number;
    utilidad_neta: number;
  };
}

@Injectable({ providedIn: 'root' })
export class FinancialReportsService {
  private base = `${environment.apiUrl}/reportes/financiero`;

  constructor(private http: HttpClient) {}

  getPyGReport(fecha_inicio: string, fecha_fin: string): Observable<PyGReport> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<PyGReport>(`${this.base}/pyg`, { params });
  }

  getIVAReport(fecha_inicio: string, fecha_fin: string): Observable<IVAReport> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<IVAReport>(`${this.base}/iva`, { params });
  }

  getExecutiveSummary(fecha_inicio: string, fecha_fin: string): Observable<ExecutiveSummary> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<ExecutiveSummary>(`${this.base}/resumen`, { params });
  }

  exportarReportePDF(tipo: string, fecha_inicio: string, fecha_fin: string): Observable<Blob> {
    const params = new HttpParams()
      .set('tipo', tipo)
      .set('formato', 'pdf')
      .set('fecha_inicio', fecha_inicio)
      .set('fecha_fin', fecha_fin);
    
    return this.http.get(`${environment.apiUrl}/reportes/exportar`, { 
      params, 
      responseType: 'blob' 
    });
  }
}
