import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendedor-comisiones-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="module-actions">
      <div class="actions-bar-container">
        <div class="row align-items-center g-3">
          <!-- Búsqueda Principal (IZQUIERDA) -->
          <div class="col-lg-6">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange($event)"
                placeholder="Q Buscar por concepto o empresa..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

          <!-- Filtros (DERECHA) -->
          <div class="col-lg-6">
            <div class="row g-2">
              <!-- Filtro: Estado -->
              <div class="col-md-6">
                <div class="dropdown">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span>{{ getCurrentTabLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium">
                    <li *ngFor="let tab of tabs">
                      <a class="dropdown-item" (click)="setTab(tab.id)">{{ tab.label }}</a>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Filtro: Empresa -->
              <div class="col-md-6">
                <div class="dropdown">
                  <button 
                    class="form-select-premium dropdown-toggle d-flex align-items-center justify-content-between" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <span class="text-truncate">{{ getEmpresaLabel() }}</span>
                  </button>
                  <ul class="dropdown-menu border-0 shadow-sm dropdown-menu-premium dropdown-menu-end">
                    <li><a class="dropdown-item" (click)="setEmpresa('ALL')">Todas las Empresas</a></li>
                    <li *ngFor="let emp of empresas">
                      <a class="dropdown-item text-truncate" (click)="setEmpresa(emp)">{{ emp }}</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
    .actions-bar-container {
      background: transparent;
      border: none;
      padding: 0;
    }
  `]
})
export class VendedorComisionesActionsComponent {
  @Input() searchQuery: string = '';
  @Input() tabs: any[] = [];
  @Input() currentTab: string = 'ALL';
  @Input() empresas: string[] = [];
  @Input() selectedEmpresa: string = 'ALL';

  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() tabChange = new EventEmitter<string>();
  @Output() empresaChange = new EventEmitter<string>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }

  setTab(tabId: string) {
    this.tabChange.emit(tabId);
  }

  setEmpresa(emp: string) {
    this.empresaChange.emit(emp);
  }

  getCurrentTabLabel(): string {
    const tab = this.tabs.find(t => t.id === this.currentTab);
    return tab ? tab.label : 'Estados';
  }

  getEmpresaLabel(): string {
    return this.selectedEmpresa === 'ALL' ? 'Todas las Empresas' : this.selectedEmpresa;
  }
}
