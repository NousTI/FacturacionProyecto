import { Component, EventEmitter, Input, Output, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpresaService } from '../../services/empresa.service';

@Component({
  selector: 'app-assign-vendedor-modal',
  template: `
    <div class="modal-overlay" (click)="!loading && onClose.emit()">
      <div class="modal-container-final shadow-premium" (click)="$event.stopPropagation()">
        
        <div class="modal-header-final">
          <h2 class="modal-title-final">Asignar Vendedor Responsable</h2>
          <button (click)="onClose.emit()" class="btn-close-final" [disabled]="loading">
            <i class="bi bi-x"></i>
          </button>
        </div>

        <div class="modal-body-final">
          <p class="subtitle-premium mb-4">Selecciona el asesor encargado de gestionar la cuenta de <strong>{{ empresaName }}</strong></p>
          
          <div class="selection-list-premium scroll-custom" [class.disabled-content]="loading">
            <!-- Opción: Gestión Directa -->
            <div 
              class="selection-card-premium" 
              [ngClass]="{
                'selected': selectedVendedorId === null,
                'is-current': isCurrentVendor(null),
                'disabled': isCurrentVendor(null)
              }"
              (click)="!loading && selectVendedor(null)"
            >
              <div class="selection-icon-box direct">
                <i class="bi bi-shield-lock"></i>
              </div>
              <div class="selection-info">
                <div class="d-flex align-items-center gap-2">
                  <span class="selection-name">Gestión Directa</span>
                  <span class="badge-current" *ngIf="isCurrentVendor(null)">VENDEDOR ACTUAL</span>
                </div>
                <span class="selection-desc">Administrado directamente por el equipo de Superadmins</span>
              </div>
              <div class="selection-check">
                <i class="bi" [ngClass]="selectedVendedorId === null ? 'bi-check-circle-fill' : (isCurrentVendor(null) ? 'bi-slash-circle' : 'bi-circle')"></i>
              </div>
            </div>

            <!-- Lista de Vendedores -->
            <div 
              *ngFor="let v of vendedores" 
              class="selection-card-premium" 
              [ngClass]="{
                'selected': selectedVendedorId === v.id,
                'is-current': isCurrentVendor(v.id),
                'disabled': isCurrentVendor(v.id)
              }"
              (click)="!loading && selectVendedor(v.id)"
            >
              <div class="selection-icon-box v-icon">
                <i class="bi bi-briefcase"></i>
              </div>
              <div class="selection-info">
                <div class="d-flex align-items-center gap-2">
                  <span class="selection-name">{{ v.nombres }} {{ v.apellidos }}</span>
                  <span class="badge-current" *ngIf="isCurrentVendor(v.id)">VENDEDOR ACTUAL</span>
                </div>
                <span class="selection-desc">{{ v.email }}</span>
              </div>
              <div class="selection-check">
                <i class="bi" [ngClass]="selectedVendedorId === v.id ? 'bi-check-circle-fill' : (isCurrentVendor(v.id) ? 'bi-slash-circle' : 'bi-circle')"></i>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer-final">
          <button (click)="onClose.emit()" class="btn-cancel-final" [disabled]="loading">Cancelar</button>
          <button 
            (click)="submit()" 
            class="btn-submit-final"
            [disabled]="!hasChanges || loading"
          >
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span *ngIf="!loading">Confirmar Asignación</span>
            <span *ngIf="loading">Asignando...</span>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 53, 0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 10005;
      padding: 1rem;
    }
    .modal-container-final {
      background: #ffffff; width: 100%; max-width: 520px;
      border-radius: 28px; overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 40px 80px -20px rgba(22, 29, 53, 0.25);
    }
    .modal-header-final { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .modal-title-final { font-size: 1.15rem; font-weight: 800; color: #161d35; margin: 0; }
    .btn-close-final { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    
    .modal-body-final { padding: 0 2rem 2rem; flex: 1; }
    .subtitle-premium { font-size: 0.85rem; color: #64748b; line-height: 1.5; }
    
    .selection-list-premium { 
      display: flex; flex-direction: column; gap: 0.85rem; 
      max-height: 380px; overflow-y: auto; padding-right: 0.5rem;
    }
    .disabled-content { opacity: 0.6; pointer-events: none; }
    
    .selection-card-premium {
      padding: 1rem 1.5rem; border: 1px solid #e2e8f0; border-radius: 18px;
      display: flex; align-items: center; gap: 1.25rem; cursor: pointer; transition: all 0.2s;
    }
    .selection-card-premium:hover { border-color: #161d35; background: #fbfcfe; }
    .selection-card-premium.selected {
      border-color: #161d35; background: rgba(22, 29, 53, 0.02);
      box-shadow: 0 4px 15px rgba(22, 29, 53, 0.05);
    }
    .selection-card-premium.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #f1f5f9;
      border-color: #e2e8f0;
    }
    .selection-card-premium.is-current {
      border-style: dashed;
      border-color: #cbd5e1;
    }
    
    .badge-current {
      font-size: 0.65rem;
      background: #e2e8f0;
      color: #64748b;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    
    .selection-icon-box {
      width: 40px; height: 40px; background: #f1f5f9; color: #64748b; 
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1rem; flex-shrink: 0;
    }
    .selection-icon-box.direct { background: #ecfdf5; color: #10b981; font-size: 1.2rem; }
    .selection-icon-box.v-icon { color: #64748b; }
    
    .selection-info { display: flex; flex-direction: column; flex: 1; }
    .selection-name { font-weight: 800; color: #1e293b; font-size: 0.9rem; }
    .selection-desc { font-size: 0.75rem; color: #64748b; margin-top: 1px; }
    
    .selection-check { font-size: 1.25rem; color: #cbd5e1; }
    .selected .selection-check { color: #161d35; }
    
    .modal-footer-final {
      padding: 1.5rem 2rem; background: #f8fafc;
      display: flex; justify-content: flex-end; gap: 1rem;
      border-top: 1px solid #f1f5f9;
    }
    .btn-submit-final {
      background: #161d35; color: #ffffff; border: none;
      padding: 0.75rem 2.5rem; border-radius: 12px; font-weight: 700;
      transition: all 0.2s;
    }
    .btn-submit-final:hover { background: #232d4d; }
    .btn-submit-final:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-cancel-final {
      background: #ffffff; color: #64748b; border: 1px solid #e2e8f0;
      padding: 0.75rem 2rem; border-radius: 12px; font-weight: 600;
    }
    
    .scroll-custom::-webkit-scrollbar { width: 5px; }
    .scroll-custom::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class AssignVendedorModalComponent implements OnInit {
  @Input() empresaName: string = '';
  @Input() currentVendedorId: any = null;
  @Input() loading: boolean = false;
  @Output() onSave = new EventEmitter<number | null>();
  @Output() onClose = new EventEmitter<void>();

  selectedVendedorId: any = null;
  vendedores: any[] = [];

  constructor(
    private empresaService: EmpresaService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.selectedVendedorId = this.currentVendedorId;
    this.empresaService.getVendedores().subscribe({
      next: (data) => {
        this.vendedores = data;
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error loading vendors', err)
    });
  }

  isCurrentVendor(id: any): boolean {
    const cid = this.currentVendedorId === undefined ? null : this.currentVendedorId;
    const targetId = id === undefined ? null : id;
    if (targetId === null && cid === null) return true;
    if (targetId === null || cid === null) return false;
    return String(targetId) === String(cid);
  }

  selectVendedor(id: any) {
    if (this.isCurrentVendor(id)) return;
    this.selectedVendedorId = id;
  }

  get hasChanges(): boolean {
    const cid = this.currentVendedorId == null ? null : String(this.currentVendedorId);
    const sid = this.selectedVendedorId == null ? null : String(this.selectedVendedorId);
    return sid !== cid;
  }

  submit() {
    if (!this.hasChanges) return;
    this.onSave.emit(this.selectedVendedorId);
  }
}
