import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Cliente } from '../../../../../../../domain/models/cliente.model';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PermissionsService } from '../../../../../../../core/auth/permissions.service';
import { CLIENTES_PERMISSIONS } from '../../../../../../../constants/permission-codes';

@Component({
  selector: 'app-factura-cliente-header',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="section-lux h-100 p-3 border shadow-sm rounded-4 bg-white" [formGroup]="parentForm">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="section-title-lux mb-0 border-0 p-0" style="color: var(--primary-color);">
          <i class="bi bi-person-bounding-box me-2 text-primary"></i> Cliente / Receptor
        </div>
        <button *ngIf="canCreateCliente" type="button" class="btn-create-client-lux btn-sm py-1 px-2" (click)="openCreateClienteModal.emit()" title="Nuevo Cliente">
          <i class="bi bi-person-plus-fill me-1"></i>
          <span>Nuevo</span>
        </button>
      </div>

      <!-- Buscador -->
      <div class="search-select-lux-wrapper mb-3">
        <div class="input-lux-wrapper input-sm">
          <i class="bi bi-search"></i>
          <input type="text" 
                 class="input-lux" 
                 placeholder="Buscar por nombre o cédula..." 
                 [(ngModel)]="searchTerm" 
                 [ngModelOptions]="{standalone: true}"
                 (focus)="onClientSearchFocus()"
                 (input)="filterClientes()"
                 (click)="$event.stopPropagation()">
          <button type="button" class="btn-clear-search" *ngIf="searchTerm" (click)="clearClientSearch()">
            <i class="bi bi-x"></i>
          </button>
        </div>
        
        <!-- Dropdown Results -->
        <div class="search-results-lux custom-scrollbar" *ngIf="isClientDropdownOpen" (click)="$event.stopPropagation()">
          <div class="search-item-lux" *ngFor="let cli of filteredClientes" (click)="selectCliente(cli)">
            <div class="fw-bold">{{ cli.razon_social }}</div>
            <div class="small-info">{{ cli.identificacion }} • {{ cli.email }}</div>
          </div>
          <div class="search-item-lux no-results p-3 text-center" *ngIf="filteredClientes.length === 0 && searchTerm">
            <span class="small text-muted">No se encontraron resultados</span>
          </div>
        </div>
      </div>

      <!-- Sugerencias / Rápidos -->
      <div *ngIf="!selectedCliente && !searchTerm && clientes.length > 0" class="mb-3">
        <label class="form-label-lux mb-2" style="font-size: 0.6rem;">Sugerencias rápidas:</label>
        <div class="d-flex flex-wrap gap-2">
          <button type="button" *ngFor="let cli of clientes.slice(0, 3)" 
                  (click)="selectCliente(cli)"
                  class="badge bg-light text-dark border py-2 px-3 rounded-pill text-decoration-none fw-bold"
                  style="font-size: 0.7rem; cursor: pointer; transition: all 0.2s; border-color: #e2e8f0 !important;">
            <i class="bi bi-person-fill me-1 text-primary"></i> {{ cli.razon_social | slice:0:20 }}{{ cli.razon_social.length > 20 ? '...' : '' }}
          </button>
        </div>
      </div>

      <!-- Info del Cliente Seleccionado -->
      <div *ngIf="selectedCliente" class="client-info-card-lux p-3 rounded-3 animate__animated animate__fadeIn" style="background-color: #f8fafc; border: 1px solid #e2e8f0;">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1 overflow-hidden">
            <h6 class="fw-800 mb-2 text-dark text-truncate">{{ selectedCliente.razon_social }}</h6>
            <div class="d-flex flex-wrap gap-2 mb-2">
              <span class="badge bg-white text-dark border small-cap px-2 py-1" style="font-size: 0.6rem; border-color: #e2e8f0 !important;">
                <i class="bi bi-card-text me-1 text-muted"></i>{{ selectedCliente.identificacion }}
              </span>
              <span class="badge bg-white text-dark border small-cap px-2 py-1" style="font-size: 0.6rem; border-color: #e2e8f0 !important;">
                <i class="bi bi-envelope me-1 text-muted"></i>{{ selectedCliente.email }}
              </span>
            </div>
            <div class="small text-muted text-truncate" style="font-size: 0.75rem;">
              <i class="bi bi-geo-alt-fill me-1"></i>{{ selectedCliente.direccion || 'Sin dirección registrada' }}
            </div>
          </div>
          <button *ngIf="canEditCliente" type="button" class="btn-edit-client-small ms-2" (click)="openEditClienteModal.emit(selectedCliente)" title="Editar información del cliente">
            <i class="bi bi-pencil-square"></i>
          </button>
        </div>
      </div>

      <div *ngIf="!selectedCliente" class="px-3 py-4 text-center border border-dashed rounded-3" style="background: #fafbfc; border-style: dashed !important;">
        <i class="bi bi-person-dash text-muted mb-2 d-block" style="font-size: 1.8rem; opacity: 0.5;"></i>
        <p class="text-muted small fw-bold mb-0">Seleccione un cliente para la factura</p>
      </div>
    </div>
  `
})
export class FacturaClienteHeaderComponent implements OnInit, OnChanges {
  @Input() parentForm!: FormGroup;
  @Input() clientes: Cliente[] = [];
  
  @Output() openCreateClienteModal = new EventEmitter<void>();
  @Output() openEditClienteModal = new EventEmitter<Cliente>();

  searchTerm = '';
  isClientDropdownOpen = false;
  filteredClientes: Cliente[] = [];
  selectedCliente: Cliente | null = null;
  private destroy$ = new Subject<void>();

  private permissionsService = inject(PermissionsService);

  get canCreateCliente(): boolean { return this.permissionsService.hasPermission(CLIENTES_PERMISSIONS.CREAR); }
  get canEditCliente(): boolean { return this.permissionsService.hasPermission(CLIENTES_PERMISSIONS.EDITAR); }

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.filteredClientes = [...this.clientes];
    this.setupClickAway();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['clientes'] && this.clientes) {
       this.filteredClientes = [...this.clientes];
       this.syncClienteDesdeFormulario();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupClickAway() {
    fromEvent(document, 'click')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isClientDropdownOpen = false;
        this.cd.detectChanges();
      });
  }

  syncClienteDesdeFormulario() {
     const clienteId = this.parentForm.get('cliente_id')?.value;
     if (clienteId && this.clientes.length > 0) {
        const found = this.clientes.find(c => c.id === clienteId);
        if (found) {
           this.selectedCliente = found;
           this.searchTerm = `${found.razon_social} (${found.identificacion})`;
        }
     }
  }

  onClientSearchFocus() {
    this.isClientDropdownOpen = true;
    if (!this.searchTerm) {
      this.filteredClientes = [...this.clientes];
    }
  }

  filterClientes() {
    this.isClientDropdownOpen = true;
    if (!this.searchTerm) {
      this.filteredClientes = [...this.clientes];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredClientes = this.clientes.filter(c => 
      c.razon_social.toLowerCase().includes(term) || 
      c.identificacion.includes(term)
    );
  }

  clearClientSearch() {
    this.searchTerm = '';
    this.selectedCliente = null;
    this.parentForm.patchValue({ cliente_id: null });
    this.filteredClientes = [...this.clientes];
    this.isClientDropdownOpen = false;
  }

  selectCliente(cliente: Cliente) {
    this.selectedCliente = cliente;
    this.searchTerm = `${cliente.razon_social} (${cliente.identificacion})`;
    this.parentForm.patchValue({ cliente_id: cliente.id });
    this.isClientDropdownOpen = false;
  }
}

