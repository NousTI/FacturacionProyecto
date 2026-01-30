import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SriCertService, SriCertAudit, SriCertConfig } from '../../services/sri-cert.service';
import { Observable, of } from 'rxjs';

@Component({
    selector: 'app-cert-history-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="close()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header">
            <div class="d-flex align-items-center gap-3">
                 <div class="avatar rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                     style="width: 48px; height: 48px; background: #161d35;">
                    <i class="bi bi-shield-lock-fill fs-5"></i>
                 </div>
                 <div>
                    <h5 class="modal-title mb-0 fw-bold text-dark">Historial del Certificado</h5>
                    <p class="text-muted small mb-0">{{ cert?.empresa_nombre }} - {{ cert?.empresa_ruc }}</p>
                 </div>
            </div>
            <button (click)="close()" class="btn-close-custom">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>

        <div class="modal-body p-0 d-flex flex-column h-100 overflow-hidden bg-light">
           
           <div class="p-4 overflow-y-auto custom-scrollbar flex-grow-1">
                
                <div *ngIf="logs$ | async as logs; else loading">
                     <div class="timeline ps-3">
                        
                        <div *ngFor="let log of logs; let first = first" class="timeline-item position-relative pb-4 ps-4 border-start border-2" 
                             [class.border-success]="first" [class.border-light-subtle]="!first">
                             
                             <!-- Dot -->
                             <div class="timeline-dot position-absolute start-0 top-0 translate-middle rounded-circle border border-4 bg-white shadow-sm"
                                  [ngClass]="getDotClass(log.accion)"
                                  style="width: 16px; height: 16px; margin-left: -1px;"></div>

                             <div class="card border-0 shadow-sm rounded-4 ms-2 hover-card">
                                <div class="card-body p-3">
                                    <div class="d-flex justify-content-between mb-2">
                                        <span class="badge rounded-pill px-2 py-1" [ngClass]="getBadgeClass(log.accion)">
                                            {{ translateAction(log.accion) }}
                                        </span>
                                        <small class="text-muted fw-bold">{{ log.created_at | date:'medium' }}</small>
                                    </div>
                                    
                                    <h6 class="fw-bold text-dark mb-1">{{ log.user_name || 'Sistema' }}</h6>
                                    <p class="text-secondary small mb-2">
                                        {{ getActionDescription(log) }}
                                    </p>
                                    
                                    <div class="d-flex align-items-center gap-2 small text-muted bg-light p-2 rounded-3">
                                        <i class="bi bi-hdd-network"></i> IP: {{ log.ip_origen || 'Desconocida' }}
                                    </div>
                                </div>
                             </div>
                        </div>

                        <div *ngIf="logs.length === 0" class="text-center py-5">
                            <p class="text-muted">No existen registros de auditoría para este certificado.</p>
                        </div>

                     </div>
                </div>

                <ng-template #loading>
                    <div class="d-flex justify-content-center align-items-center py-5">
                        <div class="spinner-border text-primary" role="status"></div>
                    </div>
                </ng-template>

           </div>

        </div>

        <div class="modal-footer p-3 bg-white border-top">
            <button class="btn btn-outline-secondary rounded-pill px-4 fw-bold" (click)="close()">Cerrar</button>
        </div>

      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: right; z-index: 1050;
    }
    .modal-container {
      background: #ffffff; width: 500px; height: 100vh;
      box-shadow: -10px 0 30px rgba(0,0,0,0.1); display: flex; flex-direction: column;
      animation: slideInRight 0.3s ease-out;
    }
    @keyframes slideInRight {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }

    .modal-header { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .btn-close-custom { background: none; border: none; font-size: 1.2rem; color: #94a3b8; transition: color 0.2s; }
    .btn-close-custom:hover { color: #dc2626; }

    .hover-card { transition: transform 0.2s; }
    .hover-card:hover { transform: translateX(5px); }

    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `]
})
export class CertHistoryModalComponent implements OnInit {
    @Input() cert: SriCertConfig | null = null;
    @Output() onClose = new EventEmitter<void>();

    logs$: Observable<SriCertAudit[]> = of([]);

    constructor(private sriService: SriCertService) { }

    ngOnInit() {
        if (this.cert) {
            this.logs$ = this.sriService.getAuditLogs(this.cert.id);
        }
    }

    close() { this.onClose.emit(); }

    getDotClass(action: string) {
        if (action === 'CREATE') return 'border-success';
        if (action === 'DELETE') return 'border-danger';
        return 'border-primary';
    }

    getBadgeClass(action: string) {
        if (action === 'CREATE') return 'bg-success-subtle text-success';
        if (action === 'DELETE') return 'bg-danger-subtle text-danger';
        return 'bg-primary-subtle text-primary';
    }

    translateAction(action: string) {
        const map: any = { 'CREATE': 'CREACIÓN', 'UPDATE': 'ACTUALIZACIÓN', 'DELETE': 'ELIMINACIÓN' };
        return map[action] || action;
    }

    getActionDescription(log: SriCertAudit): string {
        if (log.accion === 'CREATE') return 'Se registró una nueva configuración de firma electrónica.';
        if (log.accion === 'UPDATE') return 'Se actualizaron los parámetros del certificado o ambiente.';
        if (log.accion === 'DELETE') return 'Se eliminó la configuración de firma electrónica.';
        return 'Acción registrada en el sistema.';
    }
}
