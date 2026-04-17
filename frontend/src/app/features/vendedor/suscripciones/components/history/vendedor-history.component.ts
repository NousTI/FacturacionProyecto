import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, combineLatest, BehaviorSubject, of, map } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { VendedorEmpresaService } from '../../../empresas/services/vendedor-empresa.service';
import { SuscripcionService, PagoHistorico } from '../../../../super-admin/suscripciones/services/suscripcion.service';

interface Company {
    id: string;
    name: string;
    ruc: string;
    status: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
}

@Component({
    selector: 'app-vendedor-payment-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="container-fluid h-100 p-0">
    <div class="d-flex h-100">
        
        <!-- Left Panel: Company List -->
        <div class="company-sidebar h-100 d-flex flex-column border-end" style="width: 380px; min-width: 380px;">
            <!-- Header -->
            <div class="p-4 border-bottom sticky-top z-1">
                <h2 class="h5 fw-800 text-dark mb-4 ls-tight">Mi Cartera</h2>
                
                <div class="search-wrapper position-relative">
                    <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    <input 
                        type="text" 
                        class="form-control"
                        placeholder="Buscar empresa..."
                        (input)="updateSearch($any($event.target).value)"
                    >
                </div>
            </div>
            
            <!-- List -->
            <div class="flex-grow-1 overflow-y-auto p-3 scroll-custom">
                <div *ngIf="filteredCompanies$ | async as companies" class="d-flex flex-column gap-2">
                    
                    <button *ngFor="let company of companies"
                            (click)="selectCompany(company)"
                            class="company-card w-100 border-0 p-3 rounded-4 d-flex align-items-center gap-3 text-start"
                            [class.active]="(selectedCompany | async)?.id === company.id">
                        
                        <div class="avatar d-flex align-items-center justify-content-center p-0 flex-shrink-0"
                             style="width: 48px; height: 48px; font-size: 1.1rem;">
                            {{ company.name.charAt(0).toUpperCase() }}
                        </div>
                        
                        <div class="flex-grow-1 overflow-hidden">
                            <h6 class="mb-1 fw-800 text-truncate" [class.text-corporate]="(selectedCompany | async)?.id === company.id">{{ company.name }}</h6>
                            <div class="d-flex align-items-center gap-2">
                                <span class="d-flex align-items-center gap-1 small fw-bold" 
                                      [class.text-success]="company.status === 'ACTIVO'"
                                      [class.text-danger]="company.status !== 'ACTIVO'">
                                    <i class="bi bi-circle-fill" style="font-size: 6px;"></i>
                                    {{ company.status | titlecase }}
                                </span>
                            </div>
                        </div>

                        <i class="bi bi-chevron-right small text-muted"></i>
                    </button>

                    <div *ngIf="companies.length === 0" class="text-center py-5 mt-5">
                        <i class="bi bi-search text-muted fs-1 mb-3 d-block opacity-25"></i>
                        <h6 class="text-muted fw-normal">No se encontraron resultados</h6>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel: Detail View -->
        <div class="flex-grow-1 h-100 overflow-hidden d-flex flex-column position-relative">
            
            <ng-container *ngIf="selectedCompany | async as company; else noSelection">
                
                <!-- Detail Header -->
                <div class="p-5 pb-0 mb-4 bg-white">
                    <div class="d-flex align-items-center gap-4">
                        <div class="detail-avatar d-flex align-items-center justify-content-center text-white p-0"
                             style="width: 80px; height: 80px; font-size: 2.2rem;">
                            {{ company.name.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                            <div class="text-secondary fw-800 small mb-1 ls-wider text-uppercase" style="font-size: 0.7rem;">Historial de Cobros</div>
                            <h1 class="h2 fw-800 text-dark mb-2">{{ company.name }}</h1>
                            <div class="d-flex align-items-center gap-3 text-secondary">
                                <span class="badge bg-light text-muted border-0 fw-bold px-3 py-2 rounded-pill small">
                                    <i class="bi bi-hash me-1"></i> {{ company.ruc }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Timeline Content -->
                <div class="flex-grow-1 overflow-y-auto px-5 pb-5 scroll-custom">
                    <div class="row">
                        <div class="col-12">
                            
                            <div class="d-flex align-items-center justify-content-between mb-4 mt-2">
                                <h5 class="fw-800 text-dark m-0">Registro Cronológico de Pagos</h5>
                            </div>

                            <div class="timeline-container position-relative">
                                <!-- Line -->
                                <div class="position-absolute start-0 top-0 bottom-0 ms-3 border-start border-2 border-light-subtle" style="z-index: 0; opacity: 0.5;"></div>

                                <div *ngFor="let item of history$ | async; let isFirst = first" 
                                     class="position-relative ps-5 mb-4">
                                    
                                    <!-- Dot -->
                                    <div class="timeline-dot position-absolute start-0 mt-1">
                                        <div class="timeline-dot-inner" 
                                             [ngClass]="isFirst ? 'dot-success' : 'dot-neutral'"></div>
                                    </div>

                                    <!-- Card Flat -->
                                    <div class="payment-card-flat">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <div class="d-flex align-items-center gap-2 mb-2">
                                                    <span class="badge bg-light text-dark fw-800 p-2 rounded-2" style="font-size: 10px; border: 1px solid var(--border-color) !important;">
                                                        {{ item.plan_nombre || 'PLAN DESCONOCIDO' }}
                                                    </span>
                                                    <span class="text-muted small fw-bold ms-2">
                                                        {{ item.fecha_pago | date:'dd MMM yyyy' }} · {{ item.fecha_pago | date:'HH:mm' }}
                                                    </span>
                                                </div>
                                                <div class="d-flex align-items-center gap-2" *ngIf="item.numero_comprobante">
                                                    <i class="bi bi-receipt text-muted opacity-50 small"></i>
                                                    <span class="text-muted small fw-600">Comprobante: {{ item.numero_comprobante }}</span>
                                                </div>
                                            </div>
                                            
                                            <div class="text-end">
                                                <div class="h5 fw-800 text-dark mb-2">{{ item.monto | currency }}</div>
                                                <span class="badge-timeline p-2" [ngClass]="item.estado">
                                                    {{ item.estado }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Empty State -->
                                <div *ngIf="(history$ | async)?.length === 0" class="p-5 text-center mt-4">
                                    <i class="bi bi-wallet2 text-muted fs-1 mb-3 d-block opacity-25"></i>
                                    <h6 class="text-muted fw-800">Sin pagos registrados</h6>
                                    <p class="text-muted small mb-0 fw-600">Esta empresa aún no cuenta con historial de cobros.</p>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>

            </ng-container>

            <!-- No Selection State -->
            <ng-template #noSelection>
                <div class="d-flex flex-column align-items-center justify-content-center h-100">
                    <div class="mb-4 p-4 bg-light rounded-circle">
                        <i class="bi bi-building text-muted fs-1 opacity-25"></i>
                    </div>
                    <h4 class="fw-800 text-dark mb-2">Cartera de Clientes</h4>
                    <p class="text-muted text-center mw-sm px-4 fw-600">
                        Selecciona una empresa del panel lateral para consultar su historial de pagos y facturación.
                    </p>
                </div>
            </ng-template>

        </div>
    </div>
</div>
    `,
    styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .container-fluid { background: var(--bg-main) !important; }
    
    .company-sidebar {
      background: var(--bg-main);
      border-right: 1px solid var(--border-color) !important;
    }
    
    .company-sidebar .bg-white { background: var(--bg-main) !important; }
    
    .company-card {
      background: transparent; border: 1px solid transparent !important;
      transition: all 0.2s;
    }
    .company-card:hover:not(.active) { background: var(--status-neutral-bg); }
    .company-card.active {
      background: #ffffff;
      border-color: var(--border-color) !important;
      box-shadow: 0 4px 15px -3px rgba(0,0,0,0.05);
    }
    
    .avatar { background: var(--primary-color) !important; color: #ffffff !important; font-weight: 800; border-radius: 12px !important; }
    .detail-avatar { background: var(--primary-color) !important; color: #ffffff !important; font-weight: 800; border-radius: 16px !important; box-shadow: none !important; }

    .search-wrapper .form-control {
      background: #ffffff !important; border: 1px solid var(--border-color) !important;
      height: 44px; border-radius: 12px !important; font-weight: 600;
    }
    .search-wrapper .form-control:focus {
      border-color: var(--status-info) !important;
      box-shadow: 0 0 0 4px var(--status-info-bg) !important;
    }

    .ls-tight { letter-spacing: -0.02em; }
    .ls-wider { letter-spacing: 0.05em; }
    
    .timeline-dot {
      width: 24px; height: 24px; z-index: 1; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: #ffffff;
    }
    .timeline-dot-inner { width: 12px; height: 12px; border-radius: 50%; border: 3px solid; }
    .dot-success { border-color: var(--status-success); background: var(--status-success-bg); }
    .dot-neutral { border-color: var(--text-muted); background: var(--status-neutral-bg); }

    .payment-card-flat {
      background: #ffffff; border: 1px solid var(--border-color);
      border-radius: 16px; padding: 1.5rem; transition: all 0.2s;
    }
    .payment-card-flat:hover { border-color: var(--primary-color); }
    
    .badge-timeline {
      padding: 0.4rem 0.85rem; border-radius: 6px;
      font-size: var(--text-xs); font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.5px;
      border: none !important;
    }
    .PAGADO { background: var(--status-success-bg); color: var(--status-success-text); }
    .PENDIENTE { background: var(--status-warning-bg); color: var(--status-warning-text); }
    .ANULADO, .REEMBOLSADO { background: var(--status-danger-bg); color: var(--status-danger-text); }

    .text-corporate { color: var(--primary-color) !important; }
    .fw-800 { font-weight: 800; }
    
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
  `]
})
export class VendedorHistoryComponent implements OnInit {
    companies$: Observable<Company[]> = of([]);
    filteredCompanies$: Observable<Company[]> = of([]);
    history$: Observable<PagoHistorico[]> = of([]); // Uses PagoHistorico instead of PlanHistory

    searchTerm = new BehaviorSubject<string>('');
    selectedCompany = new BehaviorSubject<Company | null>(null);

    constructor(
        private empresaService: VendedorEmpresaService,
        private adminSubService: SuscripcionService
    ) { }

    ngOnInit() {
        this.loadCompanies();

        this.filteredCompanies$ = combineLatest([
            this.companies$,
            this.searchTerm.pipe(startWith(''))
        ]).pipe(
            map(([companies, term]) => {
                const lowerTerm = term.toLowerCase();
                return companies.filter(c =>
                    c.name.toLowerCase().includes(lowerTerm) ||
                    (c.ruc && c.ruc.includes(lowerTerm))
                );
            })
        );

        this.history$ = this.selectedCompany.pipe(
            switchMap(company => {
                if (!company) return of([]);
                // Using the specific company payment history endpoint
                return this.adminSubService.getPagos(company.id);
            })
        );
    }

    loadCompanies() {
        // Fetch from vendor service
        this.companies$ = this.empresaService.getEmpresas().pipe(
            map(empresas => empresas.map(e => ({
                id: e.id,
                name: e.razonSocial,
                ruc: e.ruc || 'RUC: N/A',
                status: e.activo ? 'ACTIVO' : 'INACTIVO'
            } as Company)))
        );
        // Trigger load
        this.empresaService.loadMyEmpresas();
    }

    selectCompany(company: Company) {
        this.selectedCompany.next(company);
    }

    updateSearch(term: string) {
        this.searchTerm.next(term);
    }
}
