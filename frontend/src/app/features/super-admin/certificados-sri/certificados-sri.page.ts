import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SriCertService, SriCertConfig } from './services/sri-cert.service';
import { CertStatsComponent } from './components/cert-stats/cert-stats.component';
import { CertTableComponent } from './components/cert-table/cert-table.component';
import { CertHistoryModalComponent } from './components/cert-history-modal/cert-history-modal.component';

@Component({
    selector: 'app-certificados-sri',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CertStatsComponent,
        CertTableComponent,
        CertHistoryModalComponent
    ],
    template: `
    <div class="page-container animate__animated animate__fadeIn">
      
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h2 class="page-title mb-1">Certificados SRI</h2>
            <p class="text-secondary mb-0">Monitoreo y gestión de firmas electrónicas por empresa.</p>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary rounded-pill px-3" (click)="loadData()">
                <i class="bi bi-arrow-clockwise me-1"></i> Actualizar
            </button>
        </div>
      </div>

      <!-- 1. Stats -->
      <app-cert-stats [stats]="stats"></app-cert-stats>

      <!-- 2. Filters & Search -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <!-- Search -->
        <div class="search-box">
          <i class="bi bi-search search-icon"></i>
          <input 
            type="text" 
            class="form-control search-input" 
            placeholder="Buscar por empresa o RUC..."
            [(ngModel)]="searchQuery"
          >
        </div>

        <!-- Tabs -->
        <div class="filter-tabs d-flex gap-2">
           <button class="btn-tab" [class.active]="filterStatus === 'ALL'" (click)="setFilter('ALL')">Todos</button>
           <button class="btn-tab" [class.active]="filterStatus === 'ACTIVE'" (click)="setFilter('ACTIVE')">
                <i class="bi bi-check-circle-fill text-success fs-6 me-1"></i> Vigentes
           </button>
           <button class="btn-tab" [class.active]="filterStatus === 'EXPIRING'" (click)="setFilter('EXPIRING')">
                <i class="bi bi-exclamation-triangle-fill text-warning fs-6 me-1"></i> Por Vencer
           </button>
           <button class="btn-tab" [class.active]="filterStatus === 'EXPIRED'" (click)="setFilter('EXPIRED')">
                <i class="bi bi-x-circle-fill text-danger fs-6 me-1"></i> Vencidos
           </button>
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
      ></app-cert-table>

      <!-- 4. Modal -->
      <app-cert-history-modal
        *ngIf="showHistoryModal"
        [cert]="selectedCert"
        (onClose)="showHistoryModal = false"
      ></app-cert-history-modal>

    </div>
  `,
    styles: [`
    .page-container { padding: 1.5rem 2rem; min-height: 100vh; background: #f8fafc; }
    .page-title { font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
    
    .search-box { position: relative; width: 320px; }
    .search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-input { padding-left: 40px; border-radius: 12px; border: 1px solid #e2e8f0; height: 46px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }

    .btn-tab {
      background: white; border: 1px solid #e2e8f0; color: #64748b;
      padding: 0.5rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem;
      transition: all 0.2s; display: flex; align-items: center;
    }
    .btn-tab.active { background: #161d35; color: white; border-color: #161d35; }
    .btn-tab:hover:not(.active) { background: #f1f5f9; }
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

    constructor(private sriService: SriCertService) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading = true;
        this.sriService.getCerts().subscribe(data => {
            this.certificados = data;
            this.loading = false;
        });

        this.sriService.getStats().subscribe(stats => {
            this.stats = stats;
        });
    }

    get filteredCerts() {
        let filtered = this.certificados;

        // Search
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.empresa_nombre.toLowerCase().includes(q) ||
                c.empresa_ruc.includes(q)
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
}
