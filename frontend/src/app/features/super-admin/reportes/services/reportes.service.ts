import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Observable } from 'rxjs';

export interface ReporteLectura {
  id: string;
  nombre: string;
  tipo: string;
  parametros?: any;
  url_descarga?: string;
  estado: string;
  empresa_id: string;
  usuario_id: string;
  created_at: string;
  updated_at: string;
}

// R-031
export interface EmpresaZonaRescate {
  id: string;
  nombre_empresa: string;
  plan_nombre: string;
  ultimo_acceso: string | null;
  fecha_vencimiento: string | null;
  email: string | null;
  telefono: string | null;
  deadline: string | null;
  vendedor_nombre: string | null;
  fecha_registro: string | null;
  representante: string | null;
}

export interface EmpresaZonaUpgrade {
  id: string;
  nombre_empresa: string;
  plan_nombre: string;
  max_facturas_mes: number;
  facturas_mes: number;
  porcentaje_uso: number;
}

export interface ReporteGlobal {
  empresas_activas: number;
  empresas_nuevas_mes: number;
  ingresos_anio: number;
  variacion_ingresos_anio: number;
  ingresos_mes: number;
  variacion_ingresos_mes: number;
  usuarios_nuevos_mes: number;
  tasa_crecimiento: number;
  tasa_abandono: number;
  zona_upgrade: number;
  zona_rescate: number;
  empresas_rescate: EmpresaZonaRescate[];
  empresas_upgrade: EmpresaZonaUpgrade[];
  planes_mas_vendidos: { plan: string; ventas: number; ingresos: number }[];
  top_vendedores: { vendedor: string; empresas: number; ingresos_generados: number }[];
}

// R-032
export interface KPIsComisiones {
  comisiones_pendientes: number;
  pagadas_mes: number;
  vendedores_activos: number;
  porcentaje_upgrades: number | null;
  porcentaje_clientes_perdidos: number | null;
}

export interface DetalleComision {
  vendedor: string;
  empresa: string;
  tipo_venta: string;
  plan: string;
  comision: number;
  estado: string;
  fecha: string | null;
}

export interface ReporteComisiones {
  kpis: KPIsComisiones;
  detalle: DetalleComision[];
  top_vendedores: { vendedor: string; empresas: number; ingresos_generados: number }[];
  planes_mas_vendidos: { plan: string; ventas: number; ingresos: number }[];
}

// R-033
export interface UsoEmpresa {
  empresa: string;
  total_usuarios: number;
  usuarios_activos: number;
  facturas_mes: number;
  max_facturas_mes: number | null;
  porcentaje_uso: number;
  modulos_usados: number;
  modulos_total: number;
  plan_nombre: string | null;
  estado_suscripcion: string | null;
  ultimo_acceso: string | null;
}

export interface ReporteUso {
  empresas: UsoEmpresa[];
  modulos_mas_usados: { modulo: string; empresas_usando: number; porcentaje: number }[];
  promedio_usuarios: number | null;
  max_usuarios: number | null;
  min_usuarios: number | null;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private base = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  // Métodos legacy (compatibilidad)
  generarReporte(tipo: string, nombre: string, parametros?: any): Observable<ReporteLectura> {
    return this.http.post<ReporteLectura>(`${this.base}/superadmin`, { tipo, nombre, parametros });
  }

  obtenerDatosPreview(tipo: string, parametros?: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.base}/preview`, { tipo, nombre: 'PREVIEW', parametros });
  }

  // R-031
  getReporteGlobal(params: { fecha_inicio?: string; fecha_fin?: string } = {}): Observable<ReporteGlobal> {
    let httpParams = new HttpParams();
    if (params.fecha_inicio) httpParams = httpParams.set('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) httpParams = httpParams.set('fecha_fin', params.fecha_fin);
    return this.http.get<ReporteGlobal>(`${this.base}/superadmin/global`, { params: httpParams });
  }

  // R-032
  getReporteComisiones(params: {
    vendedor_id?: string;
    estado?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Observable<ReporteComisiones> {
    let httpParams = new HttpParams();
    if (params.vendedor_id) httpParams = httpParams.set('vendedor_id', params.vendedor_id);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    if (params.fecha_inicio) httpParams = httpParams.set('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) httpParams = httpParams.set('fecha_fin', params.fecha_fin);
    return this.http.get<ReporteComisiones>(`${this.base}/superadmin/comisiones`, { params: httpParams });
  }

  // R-033
  getReporteUso(params: { fecha_inicio?: string; fecha_fin?: string } = {}): Observable<ReporteUso> {
    let httpParams = new HttpParams();
    if (params.fecha_inicio) httpParams = httpParams.set('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) httpParams = httpParams.set('fecha_fin', params.fecha_fin);
    return this.http.get<ReporteUso>(`${this.base}/superadmin/uso-empresas`, { params: httpParams });
  }

  exportarPDF(tipo: string, params: any): Observable<Blob> {
    let httpParams = new HttpParams().set('tipo', tipo).set('formato', 'pdf');
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.set(key, params[key]);
    });
    // El endpoint de exportación general suele estar en /api/reportes/exportar
    // Según router.py: router.get("/exportar", ...)
    return this.http.get(`${this.base}/exportar`, {
      params: httpParams,
      responseType: 'blob'
    });
  }
}
