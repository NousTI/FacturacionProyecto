import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanService, Plan } from '../../super-admin/planes/services/plan.service';
import { PlanStatsComponent } from '../../super-admin/planes/components/plan-stats/plan-stats.component';
import { VendedorPlanActionsComponent } from './components/plan-actions/vendedor-plan-actions.component';
import { VendedorPlanTableComponent } from './components/plan-table/vendedor-plan-table.component';
import { PlanCompaniesModalComponent } from '../../super-admin/planes/components/plan-companies-modal/plan-companies-modal.component';
import { PlanDetailsModalComponent } from '../../super-admin/planes/components/plan-details-modal/plan-details-modal.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { UiService } from '../../../shared/services/ui.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-vendedor-planes',
    standalone: true,
    imports: [
        CommonModule,
        PlanStatsComponent,
        VendedorPlanActionsComponent,
        VendedorPlanTableComponent,
        PlanCompaniesModalComponent,
        PlanDetailsModalComponent,
        ToastComponent
    ],
    template: `
    <div class="planes-page-container animate__animated animate__fadeIn">
      
      <!-- 1. ESTADÍSTICAS DE PLANES (Exactly the same as admin) -->
      <app-plan-stats
        [stats]="stats"
      ></app-plan-stats>

      <!-- 2. ACCIONES Y BÚSQUEDA (Restricted: No New Plan) -->
      <app-vendedor-plan-actions
        [(searchQuery)]="searchQuery"
      ></app-vendedor-plan-actions>

      <!-- 3. TABLA DE PLANES (Restricted Actions) -->
      <app-vendedor-plan-table
        [planes]="filteredPlanes"
        (onViewCompanies)="viewCompanies($event)"
        (onViewDetails)="viewDetails($event)"
      ></app-vendedor-plan-table>

      <!-- 4. MODALES (Reuse existing ones for View) -->
      
      <!-- Ver Detalles del Plan -->
      <app-plan-details-modal
        *ngIf="showDetailsModal && selectedPlan"
        [plan]="selectedPlan"
        (onClose)="showDetailsModal = false"
      ></app-plan-details-modal>
      
      <!-- Ver Empresas por Plan -->
      <app-plan-companies-modal
        *ngIf="showCompaniesModal"
        [planName]="selectedPlanName"
        [companies]="selectedPlanCompanies"
        (onClose)="showCompaniesModal = false"
      ></app-plan-companies-modal>

      <app-toast></app-toast>
    </div>
  `,
    styles: [`
    .planes-page-container {
      position: relative;
      min-height: 400px;
    }
  `]
})
export class VendedorPlanesPage implements OnInit {
    planes: Plan[] = [];
    searchQuery: string = '';
    stats: any = {};

    // UI Control
    showCompaniesModal: boolean = false;
    showDetailsModal: boolean = false;

    // Loading States
    globalLoading: boolean = false;

    selectedPlan: Plan | null = null;
    selectedPlanName: string = '';
    selectedPlanId: string = '';

    // Cache for companies to ensure instant access
    companiesCache: Map<string, any[]> = new Map();

    constructor(
        private planService: PlanService,
        private uiService: UiService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.globalLoading = true;

        // Subscribe to planes stream
        this.planService.getPlanes().subscribe({
            next: (planes) => {
                this.planes = planes;
                this.globalLoading = false;
                this.preloadAllCompanies();
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('Error cargando planes:', err);
                this.globalLoading = false;
                this.uiService.showToast('Error al cargar planes', 'danger');
                this.cdr.markForCheck();
            }
        });

        this.loadStats();
        this.planService.loadData(true);
    }

    loadStats() {
        this.planService.getStats().subscribe({
            next: (stats) => {
                this.stats = stats;
                this.cdr.markForCheck();
            },
            error: (err) => console.error('Error loading stats', err)
        });
    }

    preloadAllCompanies() {
        if (this.planes.length === 0) return;

        const requests = this.planes.map(plan =>
            this.planService.getCompanies(plan.id).pipe(
                map(companies => ({ planId: plan.id, companies }))
            )
        );

        forkJoin(requests).subscribe({
            next: (results) => {
                results.forEach(result => {
                    this.companiesCache.set(result.planId, result.companies);
                });
            },
            error: (err) => console.error('Error en precarga de empresas', err)
        });
    }

    get filteredPlanes() {
        if (!this.searchQuery) return this.planes;
        return this.planes.filter(p =>
            p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
    }

    selectedPlanCompanies: any[] = [];

    viewCompanies(plan: Plan) {
        this.selectedPlanName = plan.name;
        this.selectedPlanId = plan.id;

        if (this.companiesCache.has(plan.id)) {
            this.selectedPlanCompanies = this.companiesCache.get(plan.id) || [];
            this.showCompaniesModal = true;
        } else {
            this.globalLoading = true;
            this.planService.getCompanies(plan.id).subscribe({
                next: (data) => {
                    this.companiesCache.set(plan.id, data);
                    this.selectedPlanCompanies = data;
                    this.showCompaniesModal = true;
                    this.globalLoading = false;
                },
                error: (err) => {
                    console.error('Error fetching companies', err);
                    this.uiService.showToast('Error al cargar empresas del plan', 'danger');
                    this.globalLoading = false;
                }
            });
        }
    }

    viewDetails(plan: Plan) {
        this.selectedPlan = plan;
        this.showDetailsModal = true;
    }
}
