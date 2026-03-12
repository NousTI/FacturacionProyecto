import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UiService } from '../../../shared/services/ui.service';
import { SriCertService, SriCertConfig } from './services/sri-cert.service';
import { CertStatsComponent } from './components/cert-stats/cert-stats.component';
import { CertTableComponent } from './components/cert-table/cert-table.component';

@Component({
    selector: 'app-certificados-sri',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CertStatsComponent,
        CertTableComponent,
    ],
    template: `
    <div class="facturas-page-container">
      <div class="container-fluid p-0">
      <!-- 1. Stats -->
      <app-cert-stats [stats]="stats"></app-cert-stats>

      <!-- 2. Actions (Search & Filters) -->
      <div class="actions-box-lux">
        <div class="row g-3 align-items-center">
          <!-- BUSCADOR -->
          <div class="col-12 col-md-5">
            <div class="search-input-wrapper">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                class="search-input-lux" 
                placeholder="Buscar por empresa o RUC..."
                [(ngModel)]="searchQuery"
              >
            </div>
          </div>

          <!-- FILTROS Y ACTUALIZAR -->
          <div class="col-12 col-md-7">
            <div class="d-flex gap-2 justify-content-md-end flex-wrap align-items-center">
                <!-- Dropdown de Filtros (Simulado como tabs en inline pero estilo lux) -->
                <button class="btn-filter-lux" [class.active]="filterStatus === 'ALL'" (click)="setFilter('ALL')">
                    Todos
                </button>
                <button class="btn-filter-lux" [class.active]="filterStatus === 'ACTIVE'" (click)="setFilter('ACTIVE')">
                    <i class="bi bi-check-circle-fill text-success" *ngIf="filterStatus === 'ACTIVE'"></i>
                    Vigentes
                </button>
                <button class="btn-filter-lux" [class.active]="filterStatus === 'EXPIRING'" (click)="setFilter('EXPIRING')">
                    <i class="bi bi-exclamation-triangle-fill text-warning" *ngIf="filterStatus === 'EXPIRING'"></i>
                    Por Vencer
                </button>
                <button class="btn-filter-lux" [class.active]="filterStatus === 'EXPIRED'" (click)="setFilter('EXPIRED')">
                    <i class="bi bi-x-circle-fill text-danger" *ngIf="filterStatus === 'EXPIRED'"></i>
                    Vencidos
                </button>
                
                <div class="ms-md-2 border-start ps-3 border-light opacity-50 d-none d-md-block" style="height: 30px;"></div>
            </div>
          </div>
        </div>
      </div>

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
      <div class="modal fade" [class.show]="showDetailsModal" [style.display]="showDetailsModal ? 'block' : 'none'" tabindex="-1" style="background: rgba(0,0,0,0.5);">
         <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 rounded-4 shadow-lg">
               <div class="modal-header border-bottom-0 pb-0 pt-4 px-4">
                  <h5 class="modal-title fw-bold">Detalles del Certificado</h5>
                  <button type="button" class="btn-close" (click)="closeDetails()"></button>
               </div>
               <div class="modal-body p-4" *ngIf="selectedDetailCert">
                  <div class="row g-4">
                     <!-- Info Empresa -->
                     <div class="col-md-6">
                        <h6 class="text-uppercase text-secondary fw-bold mb-3" style="font-size: 0.75rem;">Información de la Empresa</h6>
                        <ul class="list-group list-group-flush">
                           <li class="list-group-item px-0 d-flex justify-content-between border-light">
                              <span class="text-muted">Empresa</span>
                              <span class="fw-bold">{{selectedDetailCert.empresa_nombre || 'No asignada'}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light">
                              <span class="text-muted">RUC</span>
                              <span class="fw-bold">{{selectedDetailCert.empresa_ruc || 'Sin RUC'}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light">
                              <span class="text-muted">Ambiente</span>
                              <span class="fw-bold">{{selectedDetailCert.ambiente}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light">
                              <span class="text-muted">Emisión</span>
                              <span class="fw-bold">{{selectedDetailCert.tipo_emision}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light">
                              <span class="text-muted">Estado</span>
                              <span class="fw-bold" [ngClass]="{
                                 'text-success': selectedDetailCert.estado === 'ACTIVO',
                                 'text-danger': selectedDetailCert.estado !== 'ACTIVO'
                              }">{{selectedDetailCert.estado}}</span>
                           </li>
                        </ul>
                     </div>

                     <!-- Info Certificado -->
                     <div class="col-md-6">
                        <h6 class="text-uppercase text-secondary fw-bold mb-3" style="font-size: 0.75rem;">Detalles del Archivo P12</h6>
                        <ul class="list-group list-group-flush">
                           <li class="list-group-item px-0 d-flex flex-column gap-1 border-light">
                              <span class="text-muted small">Emisor</span>
                              <span class="fw-bold text-break" style="font-size: 0.9rem;">{{selectedDetailCert.cert_emisor}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex flex-column gap-1 border-light">
                              <span class="text-muted small">Sujeto</span>
                              <span class="fw-bold text-break" style="font-size: 0.85rem;">{{selectedDetailCert.cert_sujeto}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light">
                              <span class="text-muted">Serial</span>
                              <span class="fw-bold text-truncate" style="max-width: 130px;" title="{{selectedDetailCert.cert_serial}}">{{selectedDetailCert.cert_serial}}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light">
                              <span class="text-muted">Activación</span>
                              <span class="fw-bold" style="font-size: 0.85rem;">{{ selectedDetailCert.fecha_activacion_cert ? (selectedDetailCert.fecha_activacion_cert | date:'medium') : 'No registrada' }}</span>
                           </li>
                           <li class="list-group-item px-0 d-flex justify-content-between border-light">
                              <span class="text-muted">Vencimiento</span>
                              <span class="fw-bold text-danger" style="font-size: 0.85rem;">{{selectedDetailCert.fecha_expiracion_cert | date:'medium'}}</span>
                           </li>
                        </ul>
                     </div>
                  </div>
               </div>
               <div class="modal-footer border-top-0 pb-4 px-4 pt-0">
                  <button type="button" class="btn btn-light px-4 py-2 rounded-3 fw-bold" (click)="closeDetails()">Cerrar</button>
               </div>
            </div>
         </div>
      </div>
    </div>
    </div>
  `,
    styles: [`
    .facturas-page-container { min-height: 100vh; background: #f8fafc; }
    
    .actions-box-lux {
      background: white; border: 1px solid #f1f5f9;
      border-radius: 20px; padding: 1rem 1.5rem;
      margin-bottom: 2rem;
    }
    
    .search-input-wrapper {
      position: relative; display: flex; align-items: center;
    }
    .search-input-wrapper i {
      position: absolute; left: 1rem; color: #94a3b8; font-size: 1.1rem;
    }
    .search-input-lux {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;
      padding: 0.75rem 1rem 0.75rem 2.8rem; font-size: 0.9rem; font-weight: 600;
      color: #1e293b; width: 100%; outline: none; transition: all 0.2s;
    }
    .search-input-lux:focus {
      border-color: #161d35; background: white; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    
    .btn-filter-lux {
      background: white; border: 1px solid #e2e8f0; color: #64748b;
      padding: 0.75rem 1.25rem; border-radius: 14px; font-weight: 700; font-size: 0.825rem;
      display: flex; align-items: center; gap: 0.6rem; transition: all 0.2s;
    }
    .btn-filter-lux:hover, .btn-filter-lux.active {
      background: #f8fafc; border-color: #cbd5e1; color: #161d35;
    }
    
    .btn-refresh-premium {
      background: white; border: 1px solid #e2e8f0; width: 42px; height: 42px;
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      color: #64748b; transition: all 0.2s;
    }
    .btn-refresh-premium:hover {
      background: #f8fafc; color: #161d35; border-color: #cbd5e1;
    }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
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
