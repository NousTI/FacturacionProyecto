import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class VendedorReportesService {
  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  generarReporte(tipo: string, nombre: string, parametros?: any): Observable<ReporteLectura> {
    return this.http.post<ReporteLectura>(`${this.apiUrl}/vendedor`, {
      tipo,
      nombre,
      parametros
    });
  }

  getR031Data(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let url = `${this.apiUrl}/vendedor/mis-empresas`;
    if (fechaInicio && fechaFin) {
      url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }
    return this.http.get<any>(url);
  }

  getR032Data(fechaInicio?: string, fechaFin?: string): Observable<any> {
    let url = `${this.apiUrl}/vendedor/mis-comisiones`;
    if (fechaInicio && fechaFin) {
      url += `?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
    }
    return this.http.get<any>(url);
  }
}
