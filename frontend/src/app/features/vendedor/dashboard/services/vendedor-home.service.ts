import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { map, tap } from 'rxjs/operators';

export interface AlertaVendedor {
  id: string;
  tipo: 'RENOVACION_PROXIMA' | 'COMISION_APROBADA';
  titulo: string;
  descripcion: string;
  fecha: string;
  accion_url?: string;
}

export interface VendedorHomeStats {
  empresas_asignadas: number;
  comisiones_pendientes: number;
  ingresos_generados: number;
  renovaciones_proximas: number;
}

export interface EmpresaResumen {
  id: string;
  razon_social: string;
  plan_nombre: string;
  estado_suscripcion: string;
  fecha_vencimiento: string;
}

export interface VendedorHomeData {
  stats: VendedorHomeStats;
  alertas: AlertaVendedor[];
  empresas: EmpresaResumen[];
}

@Injectable({
  providedIn: 'root'
})
export class VendedorHomeService {
  private apiUrl = `${environment.apiUrl}/vendedores`;

  constructor(private http: HttpClient) {}

  getHomeData(): Observable<VendedorHomeData> {
    return this.http.get<{detalles: VendedorHomeData}>(`${this.apiUrl}/me/home-data`).pipe(
      tap(res => console.log('[VendedorHomeService] API Raw Response:', res)),
      map(res => res.detalles)
    );
  }
}
