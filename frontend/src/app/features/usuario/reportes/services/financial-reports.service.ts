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
  total_facturado: { valor: number; variacion: number };
  total_recaudado: { valor: number; variacion: number };
  ingreso_efectivo: { valor: number; variacion: number };
  ingreso_tarjeta: { valor: number; variacion: number };
  ingreso_otras: {
    valor: number;
    variacion: number;
    formas_pago_detalle: Array<{ metodo_pago: string; label: string; total: number }>;
  };
  por_cobrar: { total: number; en_mora: number };
  clientes_nuevos: { valor: number; variacion: number };
  clientes_vip: { valor: number; periodo: string };
  utilidad_neta: { valor: number; margen: number };
  radar_gestion: Array<{
    origen: string;
    detalle: string;
    monto: number | null;
    estado: string;
    responsable: string;
  }>;
  monitor_rentabilidad: Array<{
    productos: string;
    vendidos: number;
    existencias: number;
    utilidad_neta: number;
    estado: string;
  }>;
  monitor_rentabilidad_por_utilidad: Array<{
    productos: string;
    vendidos: number;
    existencias: number;
    utilidad_neta: number;
    estado: string;
  }>;
  graficas: {
    anillo_ventas: { año_actual: number; año_anterior: number };
    gastos_vs_utilidad: { gastos: number; utilidad_neta: number };
  };
}

export interface SalesGeneralReport {
  resumen: {
    cantidad_facturas: number;
    subtotal_total: number;
    subtotal_15: number;
    subtotal_8: number;
    subtotal_5: number;
    subtotal_0: number;
    total_iva: number;
    iva_15: number;
    iva_8: number;
    iva_5: number;
    total_general: number;
    ticket_promedio: number;
    comparacion_anterior_porcentaje: number;
  };
  graficos: {
    por_establecimiento: Array<{ label: string; value: number }>;
    por_forma_pago: Array<{ cod: string; value: number }>;
    top_usuarios?: Array<{ usuario: string; total_ventas: number }>;
  };
  ventas_usuario?: any; // Para R-003 si se requiere integrar
}

export interface R001IvaDesglosado {
  tarifa: string;
  iva_cobrado: number;
  base_imponible: number;
}

export interface R001UsuarioVenta {
  usuario: string;
  facturas: number;
  total_ventas: number;
  ticket_promedio: number;
  anuladas: number;
  devoluciones: number;
}

export interface R001TopUsuario {
  usuario: string;
  total_ventas: number;
  facturas: number;
}

export interface R001Report {
  facturas_emitidas: { valor: number; variacion: number };
  subtotal_sin_iva: number;
  iva_desglosado: R001IvaDesglosado[];
  ticket_promedio: { valor: number; variacion: number };
  ventas_por_usuario: R001UsuarioVenta[];
  top_usuarios: R001TopUsuario[];
}

export interface MisVentasReport {
  empleado: string;
  kpis: {
    mis_facturas:    { valor: number; variacion: number };
    total_vendido:   { valor: number; variacion: number };
    devoluciones:    { valor: number; variacion: number };
    ticket_promedio: { valor: number; variacion: number };
  };
  facturas_recientes: Array<{
    numero_factura: string;
    cliente: string;
    fecha: string;
    total: number;
    estado: string;
  }>;
  mis_clientes: Array<{
    cliente: string;
    facturas: number;
    total_compras: number;
    ultima_compra: string;
    estado: string;
  }>;
}

export interface IvaR027Report {
  empresa: { ruc: string; razon_social: string; regimen: string };
  periodo:  { inicio: string; fin: string };
  fecha_limite: {
    noveno_digito: string;
    dia_limite: number;
    fecha_limite: string;
    dias_restantes: number | null;
    vencida: boolean;
    urgente: boolean;
  };
  kpis: {
    iva_a_pagar:        { valor: number; label: string; sublabel: string };
    credito_tributario: { valor: number; label: string; sublabel: string };
    ventas_tarifa_principal: { tarifa: string; valor: number; label: string; sublabel: string };
    factor:             { valor: number; valor_anterior: number; label: string; sublabel: string; tooltip: string };
  };
  bloque_400: {
    c401_bruto: number; c401_neto: number;
    c411_bruto: number; c411_neto: number;
    c403: number; c402: number; c412: number; c499: number;
    alertas: { nc_supera_ventas: boolean };
  };
  bloque_500: {
    c500: number; c510: number; c507: number;
    c563: number; c564: number; c599: number;
  };
  bloque_600: {
    c601: number; c602: number; c605: number;
    c606: number; c609: number; c699: number;
  };
  bloque_700: {
    disponible: boolean;
  };
  bloque_900: {
    c801: number; c802: number; c897: number; c898: number; c999: number;
  };
}

export interface AccountsReceivableReport {
  kpis: {
    total_por_cobrar: number;
    vencido_menor_30: number;
    cartera_critica: number;
    indice_morosidad: number;
  };
  top_clientes: Array<{
    cliente: string;
    numero_factura: string;
    saldo_total: number;
    dias_vencido: number;
    responsable: string;
    estado: string;
  }>;
  grafica_morosidad: {
    vencido_30: number;
    critico_30: number;
    porcentaje_morosidad: number;
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

  getIvaR027(fecha_inicio: string, fecha_fin: string): Observable<IvaR027Report> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<IvaR027Report>(`${this.base}/iva`, { params });
  }

  getExecutiveSummary(fecha_inicio: string, fecha_fin: string): Observable<ExecutiveSummary> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<ExecutiveSummary>(`${this.base}/resumen`, { params });
  }

  getSalesGeneral(fecha_inicio: string, fecha_fin: string): Observable<SalesGeneralReport> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<SalesGeneralReport>(`${environment.apiUrl}/reportes/ventas/general`, { params });
  }

  getAccountsReceivable(fecha_inicio: string, fecha_fin: string): Observable<AccountsReceivableReport> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<AccountsReceivableReport>(`${this.base}/cartera`, { params });
  }

  getR001Report(fecha_inicio: string, fecha_fin: string): Observable<R001Report> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<R001Report>(`${environment.apiUrl}/reportes/ventas/r001`, { params });
  }

  getSalesByUser(fecha_inicio: string, fecha_fin: string): Observable<any> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<any>(`${environment.apiUrl}/reportes/ventas/usuarios`, { params });
  }

  getMisVentas(fecha_inicio: string, fecha_fin: string): Observable<MisVentasReport> {
    const params = new HttpParams().set('fecha_inicio', fecha_inicio).set('fecha_fin', fecha_fin);
    return this.http.get<MisVentasReport>(`${this.base}/mis-ventas`, { params });
  }

  exportarMisVentasPDF(fecha_inicio: string, fecha_fin: string): Observable<Blob> {
    const params = new HttpParams()
      .set('tipo', 'MIS_VENTAS')
      .set('formato', 'pdf')
      .set('fecha_inicio', fecha_inicio)
      .set('fecha_fin', fecha_fin);
    return this.http.get(`${environment.apiUrl}/reportes/exportar`, {
      params,
      responseType: 'blob'
    });
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
