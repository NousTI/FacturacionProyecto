import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, timer, switchMap, filter, takeUntil, Subject } from 'rxjs';
import { Notificacion } from '../../domain/models/notificacion.model';
import { NotificacionesApiService } from '../api/notificaciones-api.service';
import { AuthFacade } from '../auth/auth.facade';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesFacade {
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  public notificaciones$ = this.notificacionesSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private destroy$ = new Subject<void>();

  constructor(
    private api: NotificacionesApiService,
    private authFacade: AuthFacade
  ) {
    // Escuchar cambios de autenticación para iniciar/detener el polling
    this.authFacade.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });
  }

  private startPolling() {
    this.stopPolling(); // Asegurar una sola instancia
    
    // Polling cada 30 segundos (en un sistema real usaríamos WebSockets o SSE)
    timer(0, 30000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.api.getNotificaciones(false)),
      tap(notifs => {
        this.notificacionesSubject.next(notifs);
        const unread = notifs.filter(n => !n.leido).length;
        this.unreadCountSubject.next(unread);
      })
    ).subscribe();
  }

  private stopPolling() {
    this.destroy$.next();
  }

  marcarComoLeida(id: string) {
    this.api.marcarComoLeida(id).pipe(
      tap(() => {
        const current = this.notificacionesSubject.value;
        const index = current.findIndex(n => n.id === id);
        if (index !== -1) {
          const updated = [...current];
          updated[index] = { ...updated[index], leido: true };
          this.notificacionesSubject.next(updated);
          this.unreadCountSubject.next(updated.filter(n => !n.leido).length);
        }
      })
    ).subscribe();
  }

  marcarTodasComoLeidas() {
    this.api.marcarTodasComoLeidas().pipe(
      tap(() => {
        const current = this.notificacionesSubject.value;
        const updated = current.map(n => ({ ...n, leido: true }));
        this.notificacionesSubject.next(updated);
        this.unreadCountSubject.next(0);
      })
    ).subscribe();
  }

  actualizar() {
    this.api.getNotificaciones(false).pipe(
      tap(notifs => {
        this.notificacionesSubject.next(notifs);
        this.unreadCountSubject.next(notifs.filter(n => !n.leido).length);
      })
    ).subscribe();
  }
}
