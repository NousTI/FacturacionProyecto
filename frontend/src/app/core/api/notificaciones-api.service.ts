import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { Observable } from 'rxjs';
import { Notificacion } from '../../domain/models/notificacion.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesApiService extends BaseApiService {
  private endpoint = 'notificaciones';

  getNotificaciones(soloNoLeidas: boolean = false): Observable<Notificacion[]> {
    const params = new HttpParams().set('solo_no_leidas', soloNoLeidas.toString());
    return this.get<Notificacion[]>(this.endpoint, params);
  }

  getConteoNoLeidas(): Observable<{ conteo: number }> {
    return this.get<{ conteo: number }>(`${this.endpoint}/conteo-no-leidas`);
  }

  marcarComoLeida(id: string): Observable<Notificacion> {
    return this.patch<Notificacion>(`${this.endpoint}/${id}/leer`, {});
  }

  marcarTodasComoLeidas(): Observable<{ success: boolean }> {
    return this.post<{ success: boolean }>(`${this.endpoint}/leer-todas`, {});
  }
}
