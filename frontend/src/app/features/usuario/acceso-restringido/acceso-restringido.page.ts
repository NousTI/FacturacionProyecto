import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { AuthService } from '../../../core/auth/auth.service';
import { Observable, take, retry, catchError, of } from 'rxjs';
import { LockStatusService, LockInfo } from '../../../core/services/lock-status.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-acceso-restringido',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="restriction-container animate__animated animate__fadeIn">
      <ng-container *ngIf="lockInfo$ | async as lock; else loading">
        <div class="restriction-card shadow-lg">

          <div class="icon-box">
            <i class="bi" [class]="lock.icon"></i>
          </div>

          <h2 class="title">{{ lock.title }}</h2>
          <div class="divider"
            [class.divider-warning]="lock.type === 'SUBSCRIPTION_SUSPENDIDA'"
            [class.divider-muted]="lock.type === 'SUBSCRIPTION_CANCELADA'"></div>

          <div class="content">
            <p class="message">{{ lock.message }}</p>

            <div class="reason-box" [ngClass]="getReasonClass(lock.type)">
              <i class="bi bi-info-circle me-2"></i>
              <ng-container [ngSwitch]="lock.type">
                <span *ngSwitchCase="'COMPANY_DISABLED'">Contacte al soporte para reactivar su cuenta.</span>
                <span *ngSwitchCase="'SUBSCRIPTION_SUSPENDIDA'">Su cuenta está en pausa. Regularice su situación para restablecer el acceso.</span>
                <span *ngSwitchCase="'SUBSCRIPTION_CANCELADA'">Debe contratar un nuevo plan para volver a operar en el sistema.</span>
                <span *ngSwitchDefault>Comuníquese con el administrador del sistema.</span>
              </ng-container>
            </div>

            <a *ngIf="whatsappUrl" [href]="whatsappUrl" target="_blank" class="btn-whatsapp">
              <i class="bi bi-whatsapp me-2"></i>Contactar por WhatsApp
            </a>

            <a *ngIf="whatsappUrl" [href]="whatsappUrl" target="_blank" class="btn-whatsapp-secondary mt-2">
              <i class="bi bi-whatsapp me-2"></i>Contactar Superadmin
            </a>
          </div>

          <div class="actions">
            <button (click)="logout()" class="btn-logout">
              <i class="bi bi-box-arrow-left me-2"></i>Cerrar Sesión
            </button>
          </div>

          <div class="footer">
            <span class="text-muted small">ID Sistema: {{ userId }}</span>
          </div>
        </div>
      </ng-container>

      <ng-template #loading>
        <div class="restriction-card shadow-lg">
          <div class="icon-box"><i class="bi bi-shield-slash-fill"></i></div>
          <h2 class="title">Acceso Restringido</h2>
          <div class="divider"></div>
          <div class="content">
            <p class="message">Su cuenta no tiene acceso al sistema en este momento.</p>
            <div class="reason-box reason-danger">
              <i class="bi bi-info-circle me-2"></i>Contacte al administrador del sistema.
            </div>
            <a *ngIf="whatsappUrl" [href]="whatsappUrl" target="_blank" class="btn-whatsapp">
              <i class="bi bi-whatsapp me-2"></i>Contactar Superadmin
            </a>
          </div>
          <div class="actions">
            <button (click)="logout()" class="btn-logout">
              <i class="bi bi-box-arrow-left me-2"></i>Cerrar Sesión
            </button>
          </div>
          <div class="footer"><span class="text-muted small">ID: {{ userId }}</span></div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .restriction-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 100vh;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      padding: 2rem;
      margin: 0;
      overflow-y: auto;
    }

    .restriction-card {
      background: white;
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 480px;
      text-align: center;
      position: relative;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .icon-box {
      font-size: 4rem;
      line-height: 1;
      margin-bottom: 1.5rem;
      filter: drop-shadow(0 10px 8px rgba(239, 68, 68, 0.2));
    }
    .icon-box .bi { color: #ef4444; }

    .title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .divider {
      height: 4px;
      width: 50px;
      background: #ef4444;
      margin: 1rem auto 1.5rem;
      border-radius: 2px;
    }
    .divider-warning { background: #f59e0b !important; }
    .divider-muted   { background: #94a3b8 !important; }

    .content { margin-bottom: 2rem; }

    .message {
      font-size: 1rem;
      font-weight: 500;
      color: #334155;
      margin-bottom: 1rem;
      line-height: 1.6;
    }

    .reason-box {
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: flex-start;
      text-align: left;
      gap: 0.25rem;
    }
    .reason-danger  { background: #fef2f2; border: 1px solid #fee2e2; color: #b91c1c; }
    .reason-warning { background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; }
    .reason-muted   { background: #f8fafc; border: 1px solid #e2e8f0; color: #475569; }

    .btn-whatsapp {
      display: flex; align-items: center; justify-content: center;
      width: 100%; padding: 0.7rem 1.5rem; margin-bottom: 1rem;
      background: #25d366; color: white; border: none; border-radius: 12px;
      font-weight: 700; font-size: 0.95rem; text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-whatsapp:hover { background: #1da851; transform: translateY(-2px); }

    .btn-whatsapp-secondary {
      display: flex; align-items: center; justify-content: center;
      width: 100%; padding: 0.7rem 1.5rem; margin-bottom: 1rem;
      background: #25d366; color: white; border: none; border-radius: 12px;
      font-weight: 700; font-size: 0.95rem; text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-whatsapp-secondary:hover { background: #1da851; transform: translateY(-2px); }

    .actions { margin-bottom: 1.5rem; }

    .btn-logout {
      width: 100%;
      padding: 0.75rem 1.5rem;
      background: #1e293b;
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1rem;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .btn-logout:hover {
      background: #0f172a;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    }

    .footer {
      border-top: 1px solid #f1f5f9;
      padding-top: 1.25rem;
    }
  `]
})
export class AccesoRestringidoPage implements OnInit {
  userId: string = '';
  lockInfo$: Observable<LockInfo | null>;
  whatsappUrl: string | null = null;

  constructor(
    private authFacade: AuthFacade,
    private lockStatusService: LockStatusService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {
    this.lockInfo$ = this.lockStatusService.lock$;
  }

  ngOnInit() {
    // Solo cargar si está autenticado
    if (!this.authService.isAuthenticated()) {
      return;
    }

    // Leer userId del usuario en sesión
    this.authFacade.user$.pipe(take(1)).subscribe(user => {
      this.userId = user?.id?.substring(0, 8) || '---';

      // Si no hay lock activo (acceso directo a la URL), inferirlo del estado del usuario
      this.lockStatusService.lock$.pipe(take(1)).subscribe(lock => {
        if (!lock && user) {
          if (user.empresa_activa === false) {
            this.lockStatusService.setLock('COMPANY_DISABLED');
          } else if (user.empresa_suscripcion_estado === 'SUSPENDIDA') {
            this.lockStatusService.setLock('SUBSCRIPTION_SUSPENDIDA');
          } else if (user.empresa_suscripcion_estado === 'CANCELADA') {
            this.lockStatusService.setLock('SUBSCRIPTION_CANCELADA');
          }
        }
      });
    });

    // Obtener teléfono del superadmin
    this.http.get<any>(`${environment.apiUrl}/configuracion/contacto`)
      .pipe(
        retry(2),
        catchError(() => of(null))
      )
      .subscribe({
        next: (res: any) => {
          if (res && res.detalles && res.detalles.telefono) {
            const tel = res.detalles.telefono;
            const cleaned = tel.replace(/\D/g, '');
            if (cleaned) {
              this.whatsappUrl = `https://wa.me/${cleaned}`;
            }
          }
        }
      });
  }

  getReasonClass(type: string | null): string {
    if (type === 'SUBSCRIPTION_SUSPENDIDA') return 'reason-warning';
    if (type === 'SUBSCRIPTION_CANCELADA') return 'reason-muted';
    return 'reason-danger';
  }

  logout() {
    this.authFacade.logout().subscribe();
  }
}
