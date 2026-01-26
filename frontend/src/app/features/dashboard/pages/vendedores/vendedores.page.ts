import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendedorService, VendedorStats, Vendedor } from './services/vendedor.service';
import { UiService } from '../../../../shared/services/ui.service';
import { VendedorStatsComponent } from './components/vendedor-stats/vendedor-stats.component';
import { VendedorActionsComponent } from './components/vendedor-actions/vendedor-actions.component';
import { VendedorTableComponent } from './components/vendedor-table/vendedor-table.component';
import { VendedorFormModalComponent } from './components/vendedor-form-modal/vendedor-form-modal.component';
import { VendedorDetailsModalComponent } from './components/vendedor-details-modal/vendedor-details-modal.component';
import { ReassignModalComponent } from './components/reassign-modal/reassign-modal.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirm-modal/confirm-modal.component';

@Component({
    selector: 'app-vendedores',
    template: `
    <div class="vendedores-page-container animate__animated animate__fadeIn">
      
      <!-- 1. MÓDULO DE ESTADÍSTICAS -->
      <app-vendedor-stats 
        [stats]="stats"
        class="d-block mb-4"
      ></app-vendedor-stats>

      <!-- 2. MÓDULO DE BÚSQUEDA Y ACCIONES (STICKY) -->
      <div class="sticky-actions">
        <app-vendedor-actions
          [(searchQuery)]="searchQuery"
          (onCreate)="openCreateModal()"
          class="d-block shadow-sm"
        ></app-vendedor-actions>
      </div>

      <!-- 3. MÓDULO DE TABLA DE DATOS -->
      <div class="table-container shadow-premium mt-4">
        <app-vendedor-table
          [vendedores]="filteringVendedores"
          (onAction)="handleAction($event)"
        ></app-vendedor-table>

        <!-- Empty State -->
        <div *ngIf="!loading && filteringVendedores.length === 0" class="text-center p-5 bg-white rounded-bottom-5">
            <i class="bi bi-search fs-1 text-muted d-block mb-3"></i>
            <p class="text-muted">No se encontraron vendedores que coincidan con tu búsqueda.</p>
        </div>
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
    .vendedores-page-container {
      padding: 1.5rem 2rem;
    }
    .sticky-actions {
      position: sticky;
      top: -1.5rem; /* Ajuste para el padding general */
      z-index: 1001; /* Above table header */
      background: #f8fafc; /* Fondo que coincide con el Dashboard Layout */
      padding: 1.5rem 0 1rem;
      margin: 0 -2rem;
      padding-left: 2rem;
      padding-right: 2rem;
    }
    .table-container {
        border-radius: 28px;
        background: white;
        position: relative;
        z-index: 1;
    }
    .shadow-premium {
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
    }
  `],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        VendedorStatsComponent,
        VendedorActionsComponent,
        VendedorTableComponent,
        VendedorFormModalComponent,
        VendedorDetailsModalComponent,
        ReassignModalComponent,
        ConfirmModalComponent
    ]
})
export class VendedoresPage implements OnInit {
    searchQuery: string = '';
    stats: VendedorStats = { total: 0, activos: 0, inactivos: 0, empresasTotales: 0, ingresosGenerados: 0 };
    vendedores: Vendedor[] = [];
    loading: boolean = true;

    // Loading flags for specific actions
    saving: boolean = false;
    savingStatus: boolean = false;
    savingReassign: boolean = false;

    // Modal Control
    showFormModal: boolean = false;
    showDetailsModal: boolean = false;
    showConfirmModal: boolean = false;
    showReassignModal: boolean = false;

    editing: boolean = false;
    selectedVendedor: Vendedor | null = null;
    selectedVendedorData: any = {};
    vendedorEmpresas: any[] = [];

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

    get filteringVendedores() {
        if (!this.searchQuery) return this.vendedores;
        const q = this.searchQuery.toLowerCase();
        return this.vendedores.filter(v =>
            v.nombre.toLowerCase().includes(q) ||
            v.email.toLowerCase().includes(q) ||
            v.dni.includes(q)
        );
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
        this.selectedVendedorData = { nombre: '', dni: '', email: '', telefono: '', password: '' };
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
