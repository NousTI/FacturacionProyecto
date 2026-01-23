import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vendedor } from '../../services/vendedor.service';

@Component({
  selector: 'app-reassign-modal',
  template: `
    <div class="modal-overlay animate__animated animate__fadeIn animate__faster" (click)="!saving && onClose.emit()">
      <div class="modal-content-premium shadow-premium selective-modal" (click)="$event.stopPropagation()">
        
        <div class="modal-header-premium">
          <div>
            <h2 class="modal-title-premium text-dark fw-bold mb-0">
                <i class="bi bi-arrow-repeat me-2 text-primary"></i>
                Trasladar Clientes
            </h2>
            <p class="text-muted small mb-0">Selecciona las empresas que deseas reasignar a otro vendedor.</p>
          </div>
          <button (click)="onClose.emit()" [disabled]="saving" class="btn-close-premium">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-premium scroll-custom">
          <div class="row g-4">
            
            <!-- Vendedor Destino -->
            <div class="col-12">
              <label class="form-label-premium">Vendedor Receptor</label>
              <div class="input-premium-group">
                <i class="bi bi-person-check input-icon"></i>
                <select class="form-select form-control-premium" [(ngModel)]="toVendedorId" [disabled]="saving">
                    <option [value]="null" disabled selected>¿A quién transferimos estos clientes?</option>
                    <option *ngFor="let v of otherVendedores" [value]="v.id">
                        {{ v.nombre }} ({{ v.empresasAsignadas }} empresas actuales)
                    </option>
                </select>
              </div>
            </div>

            <!-- Selección de Empresas -->
            <div class="col-12 mt-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <label class="form-label-premium mb-0">Seleccionar Empresas ({{ selectedEmpresaIds.size }})</label>
                <button class="btn btn-link btn-sm text-primary fw-bold text-decoration-none shadow-none p-0" 
                        (click)="toggleSelectAll()" [disabled]="saving">
                   {{ allSelected ? 'Desmarcar Todas' : 'Seleccionar Todas' }}
                </button>
              </div>

              <div class="companies-grid">
                <div *ngFor="let e of empresas" 
                     class="company-selection-card" 
                     [class.selected]="selectedEmpresaIds.has(e.id)"
                     (click)="!saving && toggleSelection(e.id)">
                  <div class="company-card-header">
                    <span class="company-name text-truncate">{{ e.razon_social }}</span>
                    <i class="bi" [ngClass]="selectedEmpresaIds.has(e.id) ? 'bi-check-circle-fill text-primary' : 'bi-circle text-muted'"></i>
                  </div>
                  <div class="company-card-body d-flex justify-content-between">
                    <span class="small text-muted">{{ e.ruc }}</span>
                    <span class="badge" [ngClass]="e.activo ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'" style="font-size: 0.65rem;">
                      {{ e.activo ? 'Activa' : 'Inactiva' }}
                    </span>
                  </div>
                </div>
                
                <!-- empty state -->
                <div *ngIf="empresas.length === 0" class="p-4 text-center border rounded-4 bg-light col-12">
                   <p class="text-muted small mb-0">Este vendedor no tiene empresas asignadas.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="modal-footer-premium">
          <button (click)="onClose.emit()" [disabled]="saving" class="btn-secondary-premium">Cancelar</button>
          <button (click)="submit()" [disabled]="!toVendedorId || selectedEmpresaIds.size === 0 || saving" class="btn-primary-premium d-flex align-items-center gap-2">
            <span *ngIf="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            {{ saving ? 'Transfiriendo...' : 'Confirmar Traslado Seleccionado' }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 10001;
    }
    .modal-content-premium.selective-modal {
      background: #ffffff; width: 100%; max-width: 650px;
      height: 700px; /* ALTO FIJO SOLICITADO */
      border-radius: 32px; overflow: hidden; display: flex; flex-direction: column;
    }
    .modal-header-premium {
      padding: 1.5rem 2.5rem; display: flex; justify-content: space-between; align-items: center;
      background: #fff; border-bottom: 1px solid #f1f5f9;
    }
    .modal-title-premium { font-size: 1.15rem; }
    .btn-close-premium {
      background: none; border: none; font-size: 1.5rem; color: #94a3b8;
    }

    .modal-body-premium { 
        padding: 2rem 2.5rem; 
        flex: 1; 
        overflow-y: auto; 
    }
    
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }

    .form-label-premium {
      font-size: 0.75rem; font-weight: 800; color: #64748b;
      margin-bottom: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;
      display: block;
    }
    
    .input-premium-group { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 1rem; color: #94a3b8; z-index: 10; }
    
    .form-control-premium {
      padding: 0.85rem 1rem 0.85rem 2.8rem; border-radius: 14px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      font-size: 0.9rem; font-weight: 600; width: 100%; transition: all 0.2s;
    }
    .form-control-premium:focus {
      background: #ffffff; border-color: #161d35; box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05); outline: none;
    }

    /* Companies Grid & Selection Cards */
    .companies-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }
    .company-selection-card {
        padding: 1rem 1.25rem;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s;
        background: #fff;
    }
    .company-selection-card:hover { 
        border-color: #161d35; 
        background: #f8fafc;
    }
    .company-selection-card.selected {
        border-color: #161d35;
        background: rgba(22, 29, 53, 0.02);
        box-shadow: 0 4px 15px rgba(22, 29, 53, 0.05);
    }
    .company-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.4rem;
    }
    .company-name {
        font-weight: 700;
        color: #1e293b;
        font-size: 0.9rem;
    }
    .company-card-body {
        font-size: 0.75rem;
    }

    .modal-footer-premium {
      padding: 1.5rem 2.5rem; background: #ffffff; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 1rem;
    }
    .btn-primary-premium {
      background: #161d35; color: white; border: none; padding: 0.85rem 2rem;
      border-radius: 14px; font-weight: 700; transition: all 0.2s;
    }
    .btn-primary-premium:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-secondary-premium {
      background: white; border: 1px solid #e2e8f0; padding: 0.85rem 1.5rem;
      border-radius: 14px; font-weight: 600; color: #64748b;
    }
    .shadow-premium { box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25); }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReassignModalComponent {
  @Input() fromVendedor!: Vendedor;
  @Input() otherVendedores: Vendedor[] = [];
  @Input() empresas: any[] = [];
  @Input() saving: boolean = false;

  @Output() onConfirm = new EventEmitter<{ toVendedorId: string, empresaIds: string[] }>();
  @Output() onClose = new EventEmitter<void>();

  toVendedorId: string | null = null;
  selectedEmpresaIds: Set<string> = new Set();

  get allSelected(): boolean {
    return this.empresas.length > 0 && this.selectedEmpresaIds.size === this.empresas.length;
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedEmpresaIds.clear();
    } else {
      this.empresas.forEach(e => this.selectedEmpresaIds.add(e.id));
    }
  }

  toggleSelection(empresaId: string) {
    if (this.selectedEmpresaIds.has(empresaId)) {
      this.selectedEmpresaIds.delete(empresaId);
    } else {
      this.selectedEmpresaIds.add(empresaId);
    }
  }

  submit() {
    if (this.toVendedorId && this.selectedEmpresaIds.size > 0) {
      this.onConfirm.emit({
        toVendedorId: this.toVendedorId,
        empresaIds: Array.from(this.selectedEmpresaIds)
      });
    }
  }
}
