import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { SolicitudRenovacion, SolicitudRenovacionCreate, SolicitudRenovacionProcess } from '../../domain/models/renovacion.model';

@Injectable({
  providedIn: 'root'
})
export class RenovacionesApiService extends BaseApiService {
  private endpoint = 'renovaciones';
  private solicitudesSubject = new BehaviorSubject<SolicitudRenovacion[]>([]);
  public solicitudes$ = this.solicitudesSubject.asObservable();

  solicitarRenovacion(data: SolicitudRenovacionCreate): Observable<SolicitudRenovacion> {
    return this.post<SolicitudRenovacion>(this.endpoint, data).pipe(
      tap(() => this.listarSolicitudes().subscribe())
    );
  }

  listarSolicitudes(historial: boolean = true): Observable<SolicitudRenovacion[]> {
    let params = new HttpParams();
    if (historial) params = params.set('historial', 'true');
    
    return this.get<SolicitudRenovacion[]>(this.endpoint, params).pipe(
      tap(data => this.solicitudesSubject.next(data))
    );
  }

  procesarSolicitud(id: string, data: SolicitudRenovacionProcess): Observable<SolicitudRenovacion> {
    return this.patch<SolicitudRenovacion>(`${this.endpoint}/${id}/procesar`, data).pipe(
      tap(() => this.listarSolicitudes().subscribe())
    );
  }
}
