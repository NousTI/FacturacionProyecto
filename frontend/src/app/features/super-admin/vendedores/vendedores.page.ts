import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendedorService, VendedorStats, Vendedor } from './services/vendedor.service';
import { UiService } from '../../../shared/services/ui.service';
import { PaginationState } from './components/vendedor-paginacion/vendedor-paginacion.component';
import { VendedorStatsComponent } from './components/vendedor-stats/vendedor-stats.component';
import { VendedorTableComponent } from './components/vendedor-table/vendedor-table.component';
import { VendedorFormModalComponent } from './components/vendedor-form-modal/vendedor-form-modal.component';
import { VendedorDetailsModalComponent } from './components/vendedor-details-modal/vendedor-details-modal.component';
import { ReassignModalComponent } from './components/reassign-modal/reassign-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { VendedorActionsComponent } from './components/vendedor-actions/vendedor-actions.component';

@Component({
    selector: 'app-vendedores',
    template: `
    <div class="vendedores-page-container">
      
      <!-- 1. MÓDULO DE ESTADÍSTICAS -->
      <app-vendedor-stats 
        [stats]="stats"
      ></app-vendedor-stats>

      <!-- 2. MÓDULO DE BÚSQUEDA Y ACCIONES -->
      <app-vendedor-actions
        [(searchQuery)]="searchQuery"
        [currentTab]="currentTab"
        [statusTabs]="statusTabs"
        (onTabChange)="selectTab($event)"
        (onCreate)="openCreateModal()"
      ></app-vendedor-actions>

      <!-- 3. MÓDULO DE TABLA DE DATOS -->
      <div class="table-wrapper">
        <app-vendedor-table
          [vendedores]="paginatedVendedores"
          [pagination]="pagination"
          (onAction)="handleAction($event)"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></app-vendedor-table>
      </div>

      <!-- 4. MODALS -->
      
      <!-- Modal Registro/Edición -->
      <app-vendedor-form-modal
        *ngIf="showFormModal"
        [editing]="editing"
        [saving]="saving"
        [vendedorData]="selectedVendedorData"
        (onSave)="saveVendedor($event)"
        (onClose)="showFormModal = false"
      ></app-vendedor-form-modal>

      <!-- Modal Detalles -->
      <app-vendedor-details-modal
        *ngIf="showDetailsModal"
        [vendedor]="selectedVendedor!"
        (onClose)="showDetailsModal = false"
      ></app-vendedor-details-modal>

      <!-- Modal Confirmación Estado -->
      <app-confirm-modal
        *ngIf="showConfirmModal"
        [loading]="savingStatus"
        [title]="selectedVendedor?.activo ? 'Bloquear Vendedor' : 'Activar Vendedor'"
        [message]="selectedVendedor?.activo ? '¿Estás seguro de bloquear el acceso a este vendedor? No podrá gestionar empresas hasta que sea reactivado.' : '¿Deseas activar nuevamente a este vendedor?'"
        [confirmText]="selectedVendedor?.activo ? 'Bloquear Acceso' : 'Activar Ahora'"
        [type]="selectedVendedor?.activo ? 'danger' : 'success'"
        [icon]="selectedVendedor?.activo ? 'bi-lock-fill' : 'bi-unlock-fill'"
        [empresaName]="selectedVendedor?.nombre || ''"
        (onConfirm)="confirmToggleStatus()"
        (onCancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <!-- Modal Confirmación Eliminar -->
      <app-confirm-modal
        *ngIf="showDeleteModal"
        [loading]="savingDelete"
        title="Eliminar Vendedor"
        [message]="'¿Estás seguro de eliminar a ' + (selectedVendedor?.nombre || 'este vendedor') + '? Esta acción no se puede deshacer y se eliminará su acceso al sistema.'"
        confirmText="Eliminar Definitivamente"
        type="danger"
        icon="bi-trash3-fill"
        [empresaName]="selectedVendedor?.nombre || ''"
        (onConfirm)="confirmDelete()"
        (onCancel)="showDeleteModal = false"
      ></app-confirm-modal>

      <app-reassign-modal
        *ngIf="showReassignModal"
        [saving]="savingReassign"
        [fromVendedor]="selectedVendedor!"
        [empresas]="vendedorEmpresas"
        [otherVendedores]="getOtherVendedores()"
        (onConfirm)="confirmReassign($event)"
        (onClose)="showReassignModal = false"
      ></app-reassign-modal>

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
    .vendedores-page-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
      gap: 24px;
    }
    .table-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-top: 0;
    }
  `],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        VendedorStatsComponent,
        VendedorTableComponent,
        VendedorFormModalComponent,
        VendedorDetailsModalComponent,
        ReassignModalComponent,
        ConfirmModalComponent,
        VendedorActionsComponent
    ]
})
export class VendedoresPage implements OnInit {
    searchQuery: string = '';
    stats: VendedorStats = { total: 0, activos: 0, inactivos: 0, empresasTotales: 0, ingresosGenerados: 0 };
    vendedores: Vendedor[] = [];
    loading: boolean = true;

    pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };

    // Loading flags for specific actions
    saving: boolean = false;
    savingStatus: boolean = false;
    savingReassign: boolean = false;
    savingDelete: boolean = false;

    // Modal Control
    showFormModal: boolean = false;
    showDetailsModal: boolean = false;
    showConfirmModal: boolean = false;
    showReassignModal: boolean = false;
    showDeleteModal: boolean = false;

    editing: boolean = false;
    selectedVendedor: Vendedor | null = null;
    selectedVendedorData: any = {};
    vendedorEmpresas: any[] = [];

    statusTabs = [
        { id: 'ALL', label: 'Todos' },
        { id: 'ACTIVE', label: 'Activos' },
        { id: 'INACTIVE', label: 'Inactivos' }
    ];
    currentTab: string = 'ALL';

    constructor(
        private vendedorService: VendedorService,
        private uiService: UiService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadData();
    }

    getOtherVendedores() {
        return this.vendedores.filter(v => v.id !== this.selectedVendedor?.id);
    }

    getTabLabel(id: string): string {
        const tab = this.statusTabs.find(t => t.id === id);
        return tab ? tab.label : 'Filtro';
    }

    selectTab(tabId: string) {
        this.currentTab = tabId;
        this.pagination.currentPage = 1;
    }

    get filteringVendedores() {
        let temp = this.vendedores;

        if (this.currentTab === 'ACTIVE') temp = temp.filter(v => v.activo);
        else if (this.currentTab === 'INACTIVE') temp = temp.filter(v => !v.activo);

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            temp = temp.filter(v =>
                v.nombre.toLowerCase().includes(q) ||
                v.email.toLowerCase().includes(q) ||
                v.identificacion.includes(q)
            );
        }

        this.pagination.totalItems = temp.length;
        return temp;
    }

    get paginatedVendedores(): Vendedor[] {
        const inicio = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        return this.filteringVendedores.slice(inicio, inicio + this.pagination.pageSize);
    }

    onPageChange(page: number) {
        this.pagination.currentPage = page;
        this.cd.detectChanges();
    }

    onPageSizeChange(pageSize: number) {
        this.pagination.pageSize = pageSize;
        this.pagination.currentPage = 1;
        this.cd.detectChanges();
    }

    loadData() {
        this.loading = true;
        this.vendedorService.getStats().subscribe({
            next: (s) => {
                this.stats = s;
                this.cd.detectChanges();
            }
        });

        this.vendedorService.getVendedores().subscribe({
            next: (v) => {
                this.vendedores = v;
                this.loading = false;
                this.cd.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.uiService.showToast('Error al cargar vendedores', 'danger');
            }
        });
    }

    handleAction(event: { type: string, vendedor: Vendedor }) {
        this.selectedVendedor = event.vendedor;

        if (event.type === 'toggle_status') {
            this.savingStatus = false;
            this.showConfirmModal = true;
        } else if (event.type === 'view_details') {
            this.showDetailsModal = true;
        } else if (event.type === 'edit') {
            this.editing = true;
            this.saving = false;
            this.selectedVendedorData = {
                nombres: event.vendedor.nombres,
                apellidos: event.vendedor.apellidos,
                tipoIdentificacion: event.vendedor.tipoIdentificacion,
                identificacion: event.vendedor.identificacion,
                email: event.vendedor.email,
                telefono: event.vendedor.telefono,
                tipoComision: event.vendedor.tipoComision,
                porcentajeComisionInicial: event.vendedor.porcentajeComisionInicial,
                porcentajeComisionRecurrente: event.vendedor.porcentajeComisionRecurrente,
                puedeCrearEmpresas: event.vendedor.puedeCrearEmpresas,
                puedeGestionarPlanes: event.vendedor.puedeGestionarPlanes,
                puedeAccederEmpresas: event.vendedor.puedeAccederEmpresas,
                puedeVerReportes: event.vendedor.puedeVerReportes
            };
            this.showFormModal = true;
        } else if (event.type === 'delete') {
            this.savingDelete = false;
            this.showDeleteModal = true;
        } else if (event.type === 'reassign') {
            this.savingReassign = false;
            this.vendedorEmpresas = [];
            this.vendedorService.getVendedorEmpresas(this.selectedVendedor.id).subscribe({
                next: (empresas) => {
                    this.vendedorEmpresas = empresas;
                    this.showReassignModal = true;
                    this.cd.detectChanges();
                },
                error: () => this.uiService.showToast('Error al cargar empresas del vendedor', 'danger')
            });
        }
    }

    confirmToggleStatus() {
        if (!this.selectedVendedor) return;

        this.savingStatus = true;
        this.vendedorService.toggleStatus(this.selectedVendedor.id).subscribe({
            next: () => {
                this.selectedVendedor!.activo = !this.selectedVendedor!.activo;
                this.uiService.showToast(`Vendedor ${this.selectedVendedor!.activo ? 'activado' : 'bloqueado'} con éxito`, 'success');
                this.showConfirmModal = false;
                this.savingStatus = false;
                this.loadData();
            },
            error: (err) => {
                this.savingStatus = false;
                this.uiService.showError(err, 'Error de Estado');
            }
        });
    }

    confirmDelete() {
        if (!this.selectedVendedor) return;
        this.savingDelete = true;
        this.vendedorService.eliminarVendedor(this.selectedVendedor.id).subscribe({
            next: () => {
                this.uiService.showToast(`Vendedor "${this.selectedVendedor!.nombre}" eliminado correctamente`, 'success');
                this.showDeleteModal = false;
                this.savingDelete = false;
                this.loadData();
            },
            error: (err) => {
                this.savingDelete = false;
                this.uiService.showError(err, 'Error al eliminar');
            }
        });
    }

    confirmReassign(event: { toVendedorId: string, empresaIds: string[] }) {
        if (!this.selectedVendedor) return;
        this.savingReassign = true;
        this.vendedorService.reassignCompanies(this.selectedVendedor.id, event.toVendedorId, event.empresaIds).subscribe({
            next: (res) => {
                this.uiService.showToast(res.message || 'Empresas reasignadas correctamente', 'success');
                this.showReassignModal = false;
                this.savingReassign = false;
                this.loadData();
            },
            error: (err) => {
                this.savingReassign = false;
                this.uiService.showError(err, 'Error de Reasignación');
            }
        });
    }

    openCreateModal() {
        this.editing = false;
        this.saving = false;
        this.selectedVendedorData = {
            nombres: '', apellidos: '', tipoIdentificacion: '05', identificacion: '', email: '', telefono: '',
            tipoComision: 'PORCENTAJE',
            porcentajeComisionInicial: 0,
            porcentajeComisionRecurrente: 0,
            puedeCrearEmpresas: false,
            puedeGestionarPlanes: false,
            puedeAccederEmpresas: false,
            puedeVerReportes: false
        };
        this.showFormModal = true;
    }

    saveVendedor(data: any) {
        this.saving = true;
        if (this.editing) {
            this.vendedorService.actualizarVendedor(this.selectedVendedor!.id, data).subscribe({
                next: () => {
                    this.uiService.showToast('Vendedor actualizado correctamente', 'success');
                    this.showFormModal = false;
                    this.saving = false;
                    this.loadData();
                },
                error: (err) => {
                    this.saving = false;
                    this.uiService.showError(err, 'Error de Actualización');
                }
            });
        } else {
            this.vendedorService.crearVendedor(data).subscribe({
                next: () => {
                    this.uiService.showToast('Vendedor registrado correctamente', 'success');
                    this.showFormModal = false;
                    this.saving = false;
                    this.loadData();
                },
                error: (err) => {
                    this.saving = false;
                    this.uiService.showError(err, 'Error de Registro');
                }
            });
        }
    }
}
