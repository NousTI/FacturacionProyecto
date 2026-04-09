import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { Observable, filter, map, mergeMap, Subject, takeUntil } from 'rxjs';
import { User } from '../../../domain/models/user.model';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { UiService } from '../../services/ui.service';
import { ChangeDetectorRef } from '@angular/core';
import { NotificacionesFacade } from '../../../core/notificaciones/notificaciones.facade';
import { Notificacion } from '../../../domain/models/notificacion.model';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar navbar-expand-lg bg-white">
      <div class="container-fluid p-0">
        <!-- Page Header Info -->
        <div class="page-header-info d-none d-lg-block me-auto">
          <h5 class="fw-bold mb-0 text-dark">{{ pageTitle }}</h5>
          <div class="d-flex align-items-center">
            <span class="text-muted small me-3">{{ pageDescription }}</span>
          </div>
        </div>

        <div class="search-container d-none d-md-flex ms-auto me-3">
          <i class="bi bi-search me-2 text-muted"></i>
          <input type="text" class="form-control border-0 bg-transparent shadow-none" placeholder="Buscar...">
        </div>

        <div class="d-flex align-items-center">
          <!-- Notificaciones Dropdown -->
          <div class="dropdown me-3">
            <button class="btn btn-icon position-relative" id="notifDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-bell"></i>
              <span *ngIf="(unreadCount$ | async) as count" 
                    class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                    style="font-size: 0.65rem; padding: 0.25em 0.5em;">
                {{ count > 9 ? '+9' : count }}
              </span>
            </button>
            
            <ul class="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-4 p-0 notif-dropdown" aria-labelledby="notifDropdown">
              <li class="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 class="mb-0 fw-bold">Notificaciones</h6>
                <button class="btn btn-link btn-sm text-decoration-none p-0" (click)="marcarTodasComoLeidas()">Limpiar todo</button>
              </li>
              <div class="notif-list-container">
                <ng-container *ngIf="(notificaciones$ | async) as notifs; else noNotifs">
                  <li *ngFor="let n of notifs | slice:0:10" 
                      class="dropdown-item p-3 notif-item" 
                      [class.unread]="!n.leido"
                      (click)="leerNotificacion(n)">
                    <div class="d-flex gap-3">
                      <div class="notif-icon-circle" [ngClass]="getNotifTipoClass(n.tipo)">
                        <i [class]="getNotifIcon(n.tipo)"></i>
                      </div>
                      <div class="notif-content flex-grow-1">
                        <div class="d-flex justify-content-between">
                          <span class="fw-bold small">{{ n.titulo }}</span>
                          <span class="text-muted smallest">{{ n.created_at | date:'shortTime' }}</span>
                        </div>
                        <p class="mb-0 text-muted small text-truncate-2">{{ n.mensaje }}</p>
                      </div>
                    </div>
                  </li>
                  <li *ngIf="notifs.length === 0" class="p-4 text-center">
                    <p class="text-muted small mb-0">No tienes notificaciones</p>
                  </li>
                </ng-container>
                <ng-template #noNotifs>
                  <li class="p-4 text-center">
                    <p class="text-muted small mb-0">Cargando...</p>
                  </li>
                </ng-template>
              </div>

            </ul>
          </div>
          
          <div class="user-profile d-flex align-items-center" *ngIf="user$ | async as user" [attr.data-bs-toggle]="'dropdown'">
            <div class="avatar-circle me-3">
              {{ (user.nombres?.charAt(0) || 'U') | uppercase }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.nombres }} {{ user.apellidos }}</span>
              <span class="user-role">{{ user.role }}</span>
            </div>
          </div>

          <ul class="dropdown-menu dropdown-menu-end border-0 rounded-4 mt-2">
            <li><a class="dropdown-item py-2 px-3" routerLink="/perfil"><i class="bi bi-person me-2"></i> Perfil</a></li>
            <li><hr class="dropdown-divider mx-3"></li>
            <li><button class="dropdown-item py-2 px-3 text-danger" (click)="logout()"><i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión</button></li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      height: 80px;
      min-height: 80px;
      max-height: 80px;
      border-bottom: 1px solid #e2e8f0 !important;
      padding: 0 1.5rem !important;
      box-sizing: border-box !important;
    }
    .page-header-info h5 {
      font-size: 1.1rem;
      letter-spacing: -0.5px;
    }
    .search-container {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 0 16px;
      width: 250px;
      border: 1px solid rgba(0,0,0,0.02);
      align-items: center;
    }
    .btn-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #f1f5f9;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }
    .avatar-circle {
      width: 40px;
      height: 40px;
      background: var(--primary-gradient, #4facfe);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      cursor: pointer;
      font-size: 1.1rem;
    }
    .user-profile {
      cursor: pointer;
      padding: 4px;
      border-radius: 12px;
      transition: background 0.2s;
    }
    .user-profile:hover {
      background: rgba(0,0,0,0.02);
    }
    .user-name {
      display: block;
      font-weight: 700;
      color: #0f172a;
      font-size: 0.85rem;
      line-height: 1.2;
    }
    .user-role {
      display: block;
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 500;
      line-height: 1.2;
      margin-top: 2px;
      text-transform: lowercase;
    }
    .user-role::first-letter {
      text-transform: uppercase;
    }
    .notif-dropdown {
      width: 350px;
    }
    .notif-list-container {
      max-height: 400px;
      overflow-y: auto;
    }
    .notif-item {
      cursor: pointer;
      transition: background 0.2s;
      white-space: normal !important;
      border-bottom: 1px solid rgba(0,0,0,0.03);
    }
    .notif-item:hover {
      background: #f8fafc;
    }
    .notif-item.unread {
      background: #f0f9ff;
    }
    .notif-icon-circle {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .text-truncate-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .smallest {
      font-size: 0.65rem;
    }
  `],
  standalone: false
})
export class NavbarComponent implements OnInit, OnDestroy {
  user$: Observable<User | null>;
  pageTitle: string = 'Inicio';
  pageDescription: string = 'Bienvenido al sistema';
  today = new Date();

  private destroy$ = new Subject<void>();

  constructor(
    private authFacade: AuthFacade,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private uiService: UiService,
    private cdr: ChangeDetectorRef,
    private notifFacade: NotificacionesFacade
  ) {
    this.user$ = this.authFacade.user$;
  }

  get notificaciones$(): Observable<Notificacion[]> {
    return this.notifFacade.notificaciones$;
  }

  get unreadCount$(): Observable<number> {
    return this.notifFacade.unreadCount$;
  }

  ngOnInit() {
    // 1. Subscribe to route data for initial/static titles
    this.router.events.pipe(
      takeUntil(this.destroy$),
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      Promise.resolve().then(() => {
        this.pageTitle = data['title'] || 'Inicio';
        this.pageDescription = data['description'] || 'Bienvenido al sistema';
      });
    });

    // 2. Subscribe to Dynamic Page Headers from UiService (Overrides route data)
    this.uiService.pageHeader$
      .pipe(takeUntil(this.destroy$))
      .subscribe(header => {
        Promise.resolve().then(() => {
          if (header.title) {
            this.pageTitle = header.title;
            this.pageDescription = header.description;
          }
        });
      });

    // Initial load from route
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      Promise.resolve().then(() => {
        if (!this.pageTitle || this.pageTitle === 'Inicio') {
          this.pageTitle = data['title'] || 'Inicio';
          this.pageDescription = data['description'] || 'Bienvenido al sistema';
        }
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.authFacade.logout();
  }

  getNotifIcon(tipo: string): string {
    switch (tipo) {
      case 'RENOVACION': return 'bi bi-arrow-repeat';
      case 'PAGO': return 'bi bi-credit-card';
      case 'SISTEMA': return 'bi bi-cpu';
      default: return 'bi bi-info-circle';
    }
  }

  getNotifTipoClass(tipo: string): string {
    switch (tipo) {
      case 'RENOVACION': return 'bg-primary-subtle text-primary';
      case 'PAGO': return 'bg-success-subtle text-success';
      case 'SISTEMA': return 'bg-warning-subtle text-warning';
      default: return 'bg-light text-secondary';
    }
  }

  leerNotificacion(n: Notificacion) {
    if (!n.leido) {
      this.notifFacade.marcarComoLeida(n.id);
    }
  }

  marcarTodasComoLeidas() {
    this.notifFacade.marcarTodasComoLeidas();
  }
}
