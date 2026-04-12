import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface LogAuditoria {
  id: string;
  user_id?: string;
  evento: string;
  origen: string;
  motivo?: string;
  ip_address?: string;
  user_agent?: string;
  modulo?: string;
  created_at: string;
  actor_email?: string;
  actor_nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private apiUrl = `${environment.apiUrl}/logs/auditoria`;

  constructor(private http: HttpClient) {}

  listarAuditoria(filtros: any = {}): Observable<LogAuditoria[]> {
    let params = new HttpParams();
    
    if (filtros.usuario) params = params.set('usuario', filtros.usuario);
    if (filtros.evento) params = params.set('evento', filtros.evento);
    if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());
    if (filtros.offset) params = params.set('offset', filtros.offset.toString());

    return this.http.get<LogAuditoria[]>(this.apiUrl, { params });
  }

  exportarExcel(filtros: any = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filtros.usuario) params = params.set('usuario', filtros.usuario);
    if (filtros.evento) params = params.set('evento', filtros.evento);
    if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
