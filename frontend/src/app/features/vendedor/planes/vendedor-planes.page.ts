import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanService, Plan } from '../../super-admin/planes/services/plan.service';
import { VendedorPlanStatsComponent } from './components/vendedor-plan-stats.component';
import { VendedorPlanActionsComponent } from './components/plan-actions/vendedor-plan-actions.component';
import { VendedorPlanTableComponent } from './components/plan-table/vendedor-plan-table.component';
import { PlanCompaniesModalComponent } from '../../super-admin/planes/components/plan-companies-modal/plan-companies-modal.component';
import { PlanDetailsModalComponent } from '../../super-admin/planes/components/plan-details-modal/plan-details-modal.component';
import { UiService } from '../../../shared/services/ui.service';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-vendedor-planes',
  standalone: true,
  imports: [
    CommonModule,
    VendedorPlanStatsComponent,
    VendedorPlanActionsComponent,
    VendedorPlanTableComponent,
    PlanCompaniesModalComponent,
    PlanDetailsModalComponent
  ],
  template: `
    <div class="planes-page-container">
      <!-- 1. STATS -->
      <app-vendedor-plan-stats
        [stats]="stats"
      ></app-vendedor-plan-stats>

      <!-- 2. ACTIONS & FILTERS -->
      <app-vendedor-plan-actions
        [(searchQuery)]="searchQuery"
        [(filterEstado)]="filterEstado"
        [(filterCategoria)]="filterCategoria"
        (searchQueryChange)="filterData()"
        (filterEstadoChange)="filterData()"
        (filterCategoriaChange)="filterData()"
      ></app-vendedor-plan-actions>

      <!-- 3. TABLE -->
      <div class="page-content-wrapper">
        <app-vendedor-plan-table
          [planes]="filteredPlanes"
          (onViewCompanies)="viewCompanies($event)"
          (onViewDetails)="viewDetails($event)"
        ></app-vendedor-plan-table>
      </div>

      <!-- 4. MODALS -->
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
    .planes-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-main, #ffffff);
      padding: 0;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
    }
    .page-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  `]
})
export class VendedorPlanesPage implements OnInit {
  planes: Plan[] = [];
  filteredPlanes: Plan[] = [];
  searchQuery: string = '';
  filterEstado: string = 'ALL';
  filterCategoria: string = 'ALL';

  totalPlanes: number = 0;
  planesActivos: number = 0;
  planesOcultos: number = 0;

  showCompaniesModal: boolean = false;
  showDetailsModal: boolean = false;
  selectedPlan: Plan | null = null;
  selectedPlanName: string = '';
  selectedPlanCompanies: any[] = [];

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
    this.planService.getPlanes().subscribe({
      next: (planes) => {
        this.planes = planes;
        this.calculateStats(planes);
        this.filterData();
        this.preloadAllCompanies();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando planes:', err);
        this.uiService.showToast('Error al cargar planes', 'danger');
      }
    });

    this.planService.loadData(true);
  }

  calculateStats(planes: Plan[]) {
    this.totalPlanes = planes.length;
    this.planesActivos = planes.filter(p => p.status === 'ACTIVO').length;
    this.planesOcultos = planes.filter(p => !p.visible_publico).length;
  }

  filterData() {
    let temp = [...this.planes];

    // Filter por estado
    if (this.filterEstado !== 'ALL') {
      temp = temp.filter(p => p.status === this.filterEstado);
    }

    // Filter por categoría (basado en nombre del plan)
    if (this.filterCategoria !== 'ALL') {
      temp = temp.filter(p => {
        const category = this.getPlanCategory(p.name);
        return category === this.filterCategoria;
      });
    }

    // Filter por búsqueda
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    this.filteredPlanes = temp;
    this.cdr.detectChanges();
  }

  private getPlanCategory(planName: string): string {
    if (planName.includes('Básico')) return 'BASICO';
    if (planName.includes('Profesional')) return 'PROFESIONAL';
    if (planName.includes('Enterprise')) return 'ENTERPRISE';
    return 'ALL';
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
      error: (err) => console.error('Error precarga empresas', err)
    });
  }

  viewCompanies(plan: Plan) {
    this.selectedPlanName = plan.name;
    if (this.companiesCache.has(plan.id)) {
      this.selectedPlanCompanies = this.companiesCache.get(plan.id) || [];
      this.showCompaniesModal = true;
    } else {
      this.planService.getCompanies(plan.id).subscribe({
        next: (data) => {
          this.companiesCache.set(plan.id, data);
          this.selectedPlanCompanies = data;
          this.showCompaniesModal = true;
          this.cdr.detectChanges();
        },
        error: () => this.uiService.showToast('Error al cargar empresas', 'danger')
      });
    }
  }

  viewDetails(plan: Plan) {
    this.selectedPlan = plan;
    this.showDetailsModal = true;
  }
}
