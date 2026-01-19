
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../../../../shared/components/modal/modal.component';
import { Empresa } from '../../../../../../core/services/empresa.service';

@Component({
    selector: 'app-empresa-detail',
    standalone: true,
    imports: [CommonModule, ModalComponent],
    template: `
    @if (isOpen) {
    <app-modal [title]="'Detalles de la Empresa'" [size]="'lg'" (close)="close.emit()">
        <div class="row g-4">
            <!-- Header Info -->
            <div class="col-12 d-flex align-items-center">
                <div class="avatar bg-light text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 60px; height: 60px; font-size: 1.5rem;">
                    @if(empresa?.logo_url) {
                        <img [src]="empresa?.logo_url" class="rounded-circle w-100 h-100 object-fit-cover" alt="Logo">
                    } @else {
                        <i class="bi bi-building"></i>
                    }
                </div>
                <div>
                    <h4 class="mb-0 fw-bold">{{ empresa?.nombre_comercial }}</h4>
                    <p class="text-muted mb-0 small">{{ empresa?.razon_social }}</p>
                </div>
                <div class="ms-auto">
                        <span class="badge rounded-pill px-3 py-2 fw-normal" 
                        [ngClass]="empresa?.activo ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'">
                        {{ empresa?.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                </div>
            </div>

            <hr class="text-muted opacity-25 mt-0 mb-4">

            <!-- Section: Legal -->
            <div class="col-12 mt-0">
                <h6 class="text-primary fw-bold small text-uppercase mb-3 letter-spacing-1">
                    <i class="bi bi-bank me-2"></i>Información Legal
                </h6>
            </div>
            <div class="col-md-4">
                <label class="small text-secondary fw-bold text-uppercase mb-1">RUC</label>
                <p class="mb-0 fw-medium text-dark">{{ empresa?.ruc }}</p>
            </div>
            <div class="col-md-4">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Tipo Contribuyente</label>
                <p class="mb-0 text-dark">{{ empresa?.tipo_contribuyente || 'N/A' }}</p>
            </div>
                <div class="col-md-4">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Obligado a Llevar Contabilidad</label>
                <p class="mb-0 text-dark">{{ empresa?.obligado_contabilidad ? 'SI' : 'NO' }}</p>
            </div>

            <div class="col-12">
                <hr class="text-muted opacity-10 my-1">
            </div>

            <!-- Section: Contact -->
                <div class="col-12">
                <h6 class="text-primary fw-bold small text-uppercase mb-3 mt-2 letter-spacing-1">
                    <i class="bi bi-geo-alt me-2"></i>Contacto y Ubicación
                </h6>
            </div>
                <div class="col-md-6">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Correo Electrónico</label>
                <p class="mb-0 text-dark">{{ empresa?.email || 'N/A' }}</p>
            </div>
                <div class="col-md-6">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Teléfono</label>
                <p class="mb-0 text-dark">{{ empresa?.telefono || 'N/A' }}</p>
            </div>
                <div class="col-12">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Dirección</label>
                <p class="mb-0 text-dark">{{ empresa?.direccion || 'N/A' }}</p>
            </div>

            <div class="col-12">
                <hr class="text-muted opacity-10 my-1">
            </div>

            <!-- Section: System & Dates -->
                <div class="col-12">
                <h6 class="text-primary fw-bold small text-uppercase mb-3 mt-2 letter-spacing-1">
                    <i class="bi bi-calendar3 me-2"></i>Suscripción y Sistema
                </h6>
            </div>
            <div class="col-md-6 mb-2">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Estado de Suscripción</label>
                <div>
                    <span class="badge bg-info bg-opacity-10 text-info fw-normal px-3 py-2">{{ empresa?.estado_suscripcion }}</span>
                </div>
            </div>

            <div class="col-md-6 mb-2">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Plan Actual</label>
                <div>
                    <span class="badge bg-primary bg-opacity-10 text-primary fw-normal px-3 py-2">{{ empresa?.plan || 'Sin Plan' }}</span>
                </div>
            </div>
             
             <!-- Vendor Info -->
             @if (empresa?.vendedor_id) {
             <div class="col-md-12 mb-2">
                 <label class="small text-secondary fw-bold text-uppercase mb-1">Vendedor Asignado</label>
                 <p class="mb-0 text-dark fw-medium">{{ vendedorNombre }}</p>
             </div>
             }

            <div class="col-md-3">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Inicio Plan</label>
                <p class="mb-0 small text-muted">{{ empresa?.fecha_inicio_plan ? (empresa?.fecha_inicio_plan | date:'shortDate') : '-' }}</p>
            </div>
            <div class="col-md-3">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Fin Plan</label>
                <p class="mb-0 small fw-bold" [class.text-danger]="empresa?.fecha_fin_plan">
                    {{ empresa?.fecha_fin_plan ? (empresa?.fecha_fin_plan | date:'shortDate') : '-' }}
                </p>
            </div>
            <div class="col-md-3">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Registro Empresa</label>
                <p class="mb-0 small text-muted">{{ empresa?.fecha_registro | date:'shortDate' }}</p>
            </div>
            <div class="col-md-3">
                <label class="small text-secondary fw-bold text-uppercase mb-1">Actualizado</label>
                    <p class="mb-0 small text-muted">{{ empresa?.updated_at ? (empresa?.updated_at | date:'shortDate') : '-' }}</p>
            </div>
        </div>

        <ng-container footer>
            <button class="btn btn-secondary rounded-3" (click)="close.emit()">Cerrar</button>
            <button class="btn btn-primary rounded-3" (click)="edit.emit(empresa!)">
            <i class="bi bi-pencil-fill me-2"></i>Editar
            </button>
        </ng-container>
    </app-modal>
    }
  `
})
export class EmpresaDetailComponent {
    @Input() isOpen = false;
    @Input() empresa: Empresa | null = null;
    @Input() vendedorNombre: string = '';
    @Output() close = new EventEmitter<void>();
    @Output() edit = new EventEmitter<Empresa>();
}
