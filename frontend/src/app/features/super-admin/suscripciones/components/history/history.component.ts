import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService, PlanHistory } from '../../../planes/services/plan.service';
import { Observable, combineLatest, BehaviorSubject, of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

interface Company {
    id: string;
    name: string;
    ruc: string;
    email: string;
    logoUrl?: string;
    status: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
}

@Component({
    selector: 'app-payment-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
<div class="container-fluid h-100 p-0 bg-white">
    <div class="d-flex h-100">
        
        <!-- Left Panel: Company List (Sidebar style) -->
        <div class="company-sidebar h-100 d-flex flex-column border-end bg-light-subtle" style="width: 380px; min-width: 380px;">
            <!-- Header -->
            <div class="p-4 bg-white border-bottom sticky-top z-1">
                <h2 class="h5 fw-bolder text-dark mb-4 ls-tight">Historial de Pagos</h2>
                
                <div class="search-wrapper position-relative">
                    <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                    <input 
                        type="text" 
                        class="form-control form-control-lg border-light-subtle bg-light ps-5 rounded-4 shadow-none fs-6"
                        placeholder="Buscar empresa..."
                        (input)="updateSearch($any($event.target).value)"
                    >
                </div>
            </div>
            
            <!-- List -->
            <div class="flex-grow-1 overflow-y-auto p-3">
                <div *ngIf="filteredCompanies$ | async as companies" class="d-flex flex-column gap-2">
                    
                    <button *ngFor="let company of companies"
                            (click)="selectCompany(company)"
                            class="company-card w-100 border-0 p-3 rounded-4 d-flex align-items-center gap-3 text-start transition-all"
                            [class.active]="(selectedCompany | async)?.id === company.id">
                        
                        <div class="avatar rounded-4 text-white d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0"
                             style="background-color: #161d35; color: #fff; width: 48px; height: 48px; font-size: 1.1rem; transition: all 0.2s;">
                            {{ company.name.charAt(0).toUpperCase() }}
                        </div>
                        
                        <div class="flex-grow-1 overflow-hidden">
                            <h6 class="mb-1 fw-bold text-truncate" [class.text-primary]="(selectedCompany | async)?.id === company.id">{{ company.name }}</h6>
                            <div class="d-flex align-items-center gap-2">
                                <span class="d-flex align-items-center gap-1 small fw-bold" 
                                      [class.text-success]="company.status === 'ACTIVO'"
                                      [class.text-danger]="company.status !== 'ACTIVO'">
                                    <i class="bi bi-circle-fill" style="font-size: 6px;"></i>
                                    {{ company.status | titlecase }}
                                </span>
                            </div>
                        </div>

                        <i class="bi bi-chevron-right small" 
                           [class.text-primary]="(selectedCompany | async)?.id === company.id"
                           [class.text-muted]="(selectedCompany | async)?.id !== company.id"
                           style="opacity: 0.5;"></i>
                    </button>

                    <div *ngIf="companies.length === 0" class="text-center py-5 mt-5">
                        <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3" style="width: 60px; height: 60px;">
                            <i class="bi bi-search text-secondary fs-4"></i>
                        </div>
                        <h6 class="text-secondary fw-normal">No se encontraron resultados</h6>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Panel: Detail View -->
        <div class="flex-grow-1 h-100 bg-white overflow-hidden d-flex flex-column position-relative">
            
            <ng-container *ngIf="selectedCompany | async as company; else noSelection">
                
                <!-- Detail Header -->
                <div class="d-flex align-items-end justify-content-between p-5 pb-0 mb-4 bg-white fade-in-up">
                    <div class="d-flex align-items-center gap-4">
                        <div class="detail-avatar rounded-4 d-flex align-items-center justify-content-center text-white fw-bolder shadow-lg"
                             style="width: 80px; height: 80px; font-size: 2rem; background: linear-gradient(135deg, #161d35 0%, #2a3555 100%);">
                            {{ company.name.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                            <div class="text-uppercase text-secondary fw-bold small mb-1 ls-wider">Detalle de la empresa</div>
                            <h1 class="display-6 fw-bold text-dark mb-2">{{ company.name }}</h1>
                            <div class="d-flex align-items-center gap-3 text-secondary">
                                <span class="d-flex align-items-center gap-2 small fw-medium bg-light px-3 py-1 rounded-pill">
                                    <i class="bi bi-hash text-muted"></i> {{ company.ruc !== 'N/A' ? company.ruc : company.id.slice(0,8) }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Timeline Content -->
                <div class="flex-grow-1 overflow-y-auto px-5 pb-5 fade-in-up" style="animation-delay: 0.1s;">
                    <div class="row">
                        <div class="col-12">
                            
                            <div class="d-flex align-items-center justify-content-between mb-4 mt-2">
                                <h5 class="fw-bold text-dark m-0">Transacciones Recientes</h5>
                                <button class="btn btn-light btn-sm rounded-pill px-3 fw-bold text-secondary border">
                                    <i class="bi bi-download me-2"></i>Exportar
                                </button>
                            </div>

                            <div class="timeline-container position-relative">
                                <!-- Line -->
                                <div class="position-absolute start-0 top-0 bottom-0 ms-3 border-start border-2 border-light-subtle" style="z-index: 0;"></div>

                                <div *ngFor="let item of history$ | async; let isFirst = first" 
                                     class="position-relative ps-5 mb-4 group-hover-effect">
                                    
                                    <!-- Dot -->
                                    <div class="position-absolute start-0 mt-1 d-flex align-items-center justify-content-center bg-white" 
                                         style="width: 24px; height: 24px; z-index: 1;">
                                        <div class="rounded-circle border border-3" 
                                             [class.border-success]="isFirst" 
                                             [class.border-secondary]="!isFirst"
                                             [style.background-color]="isFirst ? '#d1e7dd' : '#e9ecef'"
                                             style="width: 12px; height: 12px;"></div>
                                    </div>

                                    <!-- Card -->
                                    <div class="card border bg-light-subtle rounded-4 p-4 transition-all hover-lift">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <div class="d-flex align-items-center gap-2 mb-2">
                                                    <span class="badge bg-white text-dark shadow-sm border fw-bold px-2 py-1 rounded-2" style="font-size: 11px;">
                                                        {{ item.newPlan }}
                                                    </span>
                                                    <span class="text-secondary small fw-medium">
                                                        {{ item.date | date:'longDate' }} · {{ item.date | date:'shortTime' }}
                                                    </span>
                                                </div>
                                                <div class="d-flex align-items-center gap-2" *ngIf="item.reason">
                                                    <i class="bi bi-info-circle-fill text-secondary opacity-50 small"></i>
                                                    <span class="text-secondary small">{{ item.reason }}</span>
                                                </div>
                                            </div>
                                            
                                            <div class="text-end">
                                                <div class="h5 fw-bolder text-dark mb-1">{{ item.monto | currency }}</div>
                                                <div class="badge bg-success-subtle text-success border border-success-subtle rounded-pill fw-bold px-2">
                                                    PAGADO
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Empty State Inner -->
                                <div *ngIf="(history$ | async)?.length === 0" class="card border-dashed border-2 bg-transparent p-5 text-center rounded-4 mt-4">
                                    <div class="mb-3 opacity-25">
                                        <i class="bi bi-receipt display-4"></i>
                                    </div>
                                    <h6 class="text-secondary fw-bold">Sin transacciones registradas</h6>
                                    <p class="text-muted small mb-0">Esta empresa aún no ha realizado pagos en el sistema.</p>
                                </div>

                            </div>

                        </div>
                    </div>
                </div>

            </ng-container>

            <!-- No Selection State -->
            <ng-template #noSelection>
                <div class="d-flex flex-column align-items-center justify-content-center h-100 bg-light-subtle">
                    <div class="mb-4 p-4 bg-white rounded-circle shadow-sm">
                        <i class="bi bi-grid-1x2 text-secondary fs-1 opacity-50"></i>
                    </div>
                    <h3 class="fw-bold text-dark mb-2">Seleccione una Empresa</h3>
                    <p class="text-muted text-center mw-sm px-4">
                        Haga clic en una empresa del panel lateral para visualizar su historial detallado.
                    </p>
                </div>
            </ng-template>

        </div>
    </div>
</div>
    `,
    styles: [`
        :host { display: block; height: 100%; font-family: 'Plus Jakarta Sans', 'Inter', sans-serif; }
        
        /* Premium Scrollbar */
        *::-webkit-scrollbar { width: 6px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 20px; }
        *::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.2); }

        .ls-tight { letter-spacing: -0.02em; }
        .ls-wider { letter-spacing: 0.05em; }
        
        .company-card { background: transparent; transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .company-card:hover { background: rgba(0,0,0,0.03); transform: translateX(4px); }
        .company-card.active { background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transform: translateX(0); }
        
        .hover-lift { transition: all 0.2s ease; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); background: #fff !important; }
        
        .fade-in-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; transform: translateY(10px); }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }

        .border-dashed { border-style: dashed !important; }
    `]
})
export class HistoryComponent implements OnInit {
    companies$: Observable<Company[]> = of([]);
    filteredCompanies$: Observable<Company[]> = of([]);
    history$: Observable<PlanHistory[]> = of([]);

    searchTerm = new BehaviorSubject<string>('');
    selectedCompany = new BehaviorSubject<Company | null>(null);

    mockCompanies: Company[] = [];

    constructor(private planService: PlanService) { }

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
                return this.planService.getHistory(company.id);
            })
        );
    }

    loadCompanies() {
        // Use getHistory logic from service which now handles unique companies
        // We'll trust the service logic here or mock it if needed for now
        this.companies$ = this.planService.getHistory().pipe(
            map(history => {
                const uniqueCompanies = new Map<string, Company>();
                history.forEach(h => {
                    if (!uniqueCompanies.has(h.empresaId)) {
                        uniqueCompanies.set(h.empresaId, {
                            id: h.empresaId,
                            name: h.empresaName,
                            ruc: 'N/A',
                            email: 'N/A',
                            status: 'ACTIVO'
                        });
                    }
                });
                return Array.from(uniqueCompanies.values());
            })
        );
    }

    selectCompany(company: Company) {
        this.selectedCompany.next(company);
    }

    updateSearch(term: string) {
        this.searchTerm.next(term);
    }
}
