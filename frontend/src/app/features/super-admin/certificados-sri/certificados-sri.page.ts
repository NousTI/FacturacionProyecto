import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UiService } from '../../../shared/services/ui.service';
import { SriCertService, SriCertConfig } from './services/sri-cert.service';
import { CertStatsComponent } from './components/cert-stats/cert-stats.component';
import { CertTableComponent } from './components/cert-table/cert-table.component';
import { CertActionsComponent } from './components/cert-actions/cert-actions.component';

@Component({
    selector: 'app-certificados-sri',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CertStatsComponent,
        CertTableComponent,
        CertActionsComponent,
    ],
    template: `
    <div class="certificados-sri-page-container animate__animated animate__fadeIn">
      
      <!-- 1. Stats -->
      <app-cert-stats [stats]="stats"></app-cert-stats>

      <!-- 2. Actions (Search & Filters) -->
      <app-cert-actions
        [(searchQuery)]="searchQuery"
        [(filterStatus)]="filterStatus"
      ></app-cert-actions>

      <!-- 3. Table -->
      <div *ngIf="loading" class="text-center py-5">
         <div class="spinner-border text-primary" role="status"></div>
         <p class="mt-2 text-muted fw-medium">Cargando certificados...</p>
      </div>

      <app-cert-table
        *ngIf="!loading"
        [certificados]="filteredCerts"
        (onViewHistory)="openHistory($event)"
        (onViewDetails)="openDetails($event)"
      ></app-cert-table>

      <!-- Modal Detalles -->
      <div class="modal fade" [class.show]="showDetailsModal" [style.display]="showDetailsModal ? 'block' : 'none'" tabindex="-1" style="z-index: 1060;">
         <div class="modal-backdrop-premium" *ngIf="showDetailsModal" (click)="closeDetails()"></div>
         <div class="modal-dialog modal-dialog-centered modal-lg" style="z-index: 1061;">
            <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
               <div class="modal-header border-bottom-0 pb-0 pt-4 px-4">
                  <h5 class="modal-title fw-800">Detalles del Certificado</h5>
                  <button type="button" class="btn-close" (click)="closeDetails()"></button>
               </div>
               <div class="modal-body p-4" *ngIf="selectedDetailCert">
                  <div class="row g-4">
                     <!-- Info Empresa -->
                     <div class="col-md-6">
                        <h6 class="text-uppercase text-muted fw-800 mb-3" style="font-size: 0.7rem; letter-spacing: 0.5px;">Información de la Empresa</h6>
                        <ul class="list-group list-group-flush">
                           <li class="list-group-item px-0 d-flex justify-content-between border-light bg-transparent">
                              <span class="text-muted">Empresa</span>
                              <span class="fw-bold text-main">{{selectedDetailCert.empresa_nombre || 'No asignada'}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light bg-transparent">
                              <span class="text-muted">RUC</span>
                              <span class="fw-bold" style="color: var(--primary-color);">{{selectedDetailCert.empresa_ruc || 'Sin RUC'}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light bg-transparent">
                              <span class="text-muted">Ambiente</span>
                              <span class="fw-bold text-main">{{selectedDetailCert.ambiente}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light bg-transparent">
                              <span class="text-muted">Emisión</span>
                              <span class="fw-bold text-main">{{selectedDetailCert.tipo_emision}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light bg-transparent">
                              <span class="text-muted">Estado</span>
                              <span class="fw-bold" [ngClass]="{
                                 'status-text-success': selectedDetailCert.estado === 'ACTIVO',
                                 'status-text-danger': selectedDetailCert.estado !== 'ACTIVO'
                              }">{{selectedDetailCert.estado}}</span>
                           </li>
                        </ul>
                     </div>

                     <!-- Info Certificado -->
                     <div class="col-md-6">
                        <h6 class="text-uppercase text-muted fw-800 mb-3" style="font-size: 0.7rem; letter-spacing: 0.5px;">Detalles del Archivo P12</h6>
                        <ul class="list-group list-group-flush">
                           <li class="list-group-item px-0 d-flex flex-column gap-1 border-light bg-transparent">
                              <span class="text-muted small">Emisor</span>
                              <span class="fw-bold text-main text-break" style="font-size: 0.85rem;">{{selectedDetailCert.cert_emisor}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex flex-column gap-1 border-light bg-transparent">
                              <span class="text-muted small">Sujeto</span>
                              <span class="fw-bold text-main text-break" style="font-size: 0.8rem;">{{selectedDetailCert.cert_sujeto}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light bg-transparent">
                              <span class="text-muted">Serial</span>
                              <span class="fw-bold text-main text-truncate" style="max-width: 130px;" title="{{selectedDetailCert.cert_serial}}">{{selectedDetailCert.cert_serial}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light bg-transparent">
                              <span class="text-muted">Activación</span>
                              <span class="fw-bold text-main" style="font-size: 0.8rem;">{{ selectedDetailCert.fecha_activacion_cert ? (selectedDetailCert.fecha_activacion_cert | date:'medium') : 'No registrada' }}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light bg-transparent">
                              <span class="text-muted">Vencimiento</span>
                              <span class="fw-bold status-text-danger" style="font-size: 0.8rem;">{{selectedDetailCert.fecha_expiracion_cert | date:'medium'}}</span>
                           </li>
                        </ul>
                     </div>
                  </div>
               </div>
               <div class="modal-footer border-top-0 pb-4 px-4 pt-0">
                  <button type="button" class="btn-secondary-premium" (click)="closeDetails()">Cerrar</button>
               </div>
            </div>
         </div>
      </div>
    </div>
  `,
    styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      overflow: hidden;
      min-height: 0;
    }
    .certificados-sri-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
    }

    /* Modal Premium Utils */
    .modal-backdrop-premium {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.3);
      backdrop-filter: blur(8px);
      z-index: 1060;
    }
    .fw-800 { font-weight: 800; }
    .text-main { color: var(--text-main); }
    .status-text-success { color: var(--status-success); }
    .status-text-danger { color: var(--status-danger); }

    .btn-secondary-premium {
      background: #ffffff;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 0.6rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: var(--text-base);
      transition: all 0.2s;
    }
    .btn-secondary-premium:hover {
      background: var(--status-neutral-bg);
      color: var(--text-main);
      border-color: #cbd5e1;
    }
    `]
})
export class CertificadosSriPage implements OnInit {
    certificados: SriCertConfig[] = [];
    stats: any = {};

    loading = false;
    searchQuery = '';
    filterStatus = 'ALL';

    showHistoryModal = false;
    selectedCert: SriCertConfig | null = null;
    
    showDetailsModal = false;
    selectedDetailCert: SriCertConfig | null = null;

    constructor(
        private sriService: SriCertService,
        private uiService: UiService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.uiService.setPageHeader('Certificados SRI', 'Monitoreo y gestión de firmas electrónicas por empresa.');
        this.loadData();
    }

    loadData() {
        this.loading = true;
        
        forkJoin({
            certs: this.sriService.getCerts(),
            stats: this.sriService.getStats()
        }).subscribe({
            next: (res) => {
                this.certificados = res.certs;
                this.stats = res.stats;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error cargando certificados y stats:', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    get filteredCerts() {
        let filtered = this.certificados;

        // Search
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                (c.empresa_nombre || '').toLowerCase().includes(q) ||
                (c.empresa_ruc || '').includes(q)
            );
        }

        // Filter Stats
        if (this.filterStatus === 'ACTIVE') {
            filtered = filtered.filter(c => c.estado === 'ACTIVO' && (c.days_until_expiry || 0) > 30);
        } else if (this.filterStatus === 'EXPIRING') {
            filtered = filtered.filter(c => c.estado === 'ACTIVO' && (c.days_until_expiry || 0) <= 30 && (c.days_until_expiry || 0) >= 0);
        } else if (this.filterStatus === 'EXPIRED') {
            filtered = filtered.filter(c => c.estado === 'EXPIRADO' || (c.days_until_expiry || 0) < 0);
        }

        return filtered;
    }

    setFilter(status: string) {
        this.filterStatus = status;
    }

    openHistory(cert: SriCertConfig) {
        this.selectedCert = cert;
        this.showHistoryModal = true;
    }

    openDetails(cert: SriCertConfig) {
        this.selectedDetailCert = cert;
        this.showDetailsModal = true;
    }

    closeDetails() {
        this.showDetailsModal = false;
        this.selectedDetailCert = null;
    }
}
