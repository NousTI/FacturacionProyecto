import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sidebar-wrapper d-flex flex-column flex-shrink-0 p-3 bg-white h-100 border-end" style="width: 250px;">
      <div class="d-flex align-items-center mb-4">
        <a href="/" class="d-flex align-items-center mb-md-0 me-md-auto link-dark text-decoration-none">
          <div class="bg-dark text-white rounded p-1 me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
              <span class="fw-bold fs-5">D</span>
          </div>
          <span class="fs-4 fw-bold">NousFacturacion</span>
        </a>
      </div>
      
      <div class="overflow-auto mt-2 custom-scrollbar" style="flex: 1;">
          
          <!-- 🏠 SECCIÓN: VISIÓN GENERAL -->
          <div class="mb-4">
            <span class="text-uppercase text-secondary fw-bold small ps-3" style="font-size: 0.75rem; letter-spacing: 0.5px;">🏠 Visión General</span>
            <ul class="nav nav-pills flex-column mt-2">
               <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('resumen', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'resumen'"
                   [ngClass]="activeView === 'resumen' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'resumen' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-grid-fill me-2"></i>
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          <!-- 🏢 SECCIÓN: GESTIÓN DEL SISTEMA -->
          <div class="mb-4">
            <span class="text-uppercase text-secondary fw-bold small ps-3" style="font-size: 0.75rem; letter-spacing: 0.5px;">🏢 Gestión del Sistema</span>
            <ul class="nav nav-pills flex-column mt-2">
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('empresas', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'empresas'"
                   [ngClass]="activeView === 'empresas' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'empresas' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-building me-2"></i>
                  Empresas
                </a>
              </li>
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('vendedores', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'vendedores'"
                   [ngClass]="activeView === 'vendedores' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'vendedores' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-people me-2"></i>
                  Vendedores
                </a>
              </li>
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('planes', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'planes'"
                   [ngClass]="activeView === 'planes' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'planes' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-card-checklist me-2"></i>
                  Planes y Suscripciones
                </a>
              </li>
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('certificados', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'certificados'"
                   [ngClass]="activeView === 'certificados' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'certificados' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-patch-check me-2"></i>
                  Certificados SRI
                </a>
              </li>
            </ul>
          </div>

          <!-- 💰 SECCIÓN: FINANZAS DEL SAAS -->
          <div class="mb-4">
            <span class="text-uppercase text-secondary fw-bold small ps-3" style="font-size: 0.75rem; letter-spacing: 0.5px;">💰 Finanzas del SaaS</span>
            <ul class="nav nav-pills flex-column mt-2">
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('comisiones', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'comisiones'"
                   [ngClass]="activeView === 'comisiones' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'comisiones' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-wallet2 me-2"></i>
                  Comisiones
                </a>
              </li>
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('pagos', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'pagos'"
                   [ngClass]="activeView === 'pagos' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'pagos' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-cash-coin me-2"></i>
                  Historial de Pagos
                </a>
              </li>
            </ul>
          </div>

          <!-- 📊 SECCIÓN: ANÁLISIS Y CONTROL -->
          <div class="mb-4">
            <span class="text-uppercase text-secondary fw-bold small ps-3" style="font-size: 0.75rem; letter-spacing: 0.5px;">📊 Análisis y Control</span>
            <ul class="nav nav-pills flex-column mt-2">
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('reportes', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'reportes'"
                   [ngClass]="activeView === 'reportes' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'reportes' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-file-earmark-bar-graph me-2"></i>
                  Reportes
                </a>
              </li>
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('auditoria', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'auditoria'"
                   [ngClass]="activeView === 'auditoria' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'auditoria' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-shield-lock me-2"></i>
                  Auditoría
                </a>
              </li>
            </ul>
          </div>

          <!-- ⚙️ SECCIÓN: CONFIGURACIÓN -->
          <div class="mb-4">
            <span class="text-uppercase text-secondary fw-bold small ps-3" style="font-size: 0.75rem; letter-spacing: 0.5px;">⚙️ Configuración</span>
            <ul class="nav nav-pills flex-column mt-2">
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('configuracion', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'configuracion'"
                   [ngClass]="activeView === 'configuracion' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'configuracion' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-gear me-2"></i>
                  Configuración del Sistema
                </a>
              </li>
            </ul>
          </div>

      </div>

    </div>
  `,
  styles: [`
    .sidebar-wrapper {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 1050;
        background-color: white;
    }
    .nav-link {
        border-radius: 12px;
        padding: 10px 16px;
        transition: all 0.2s;
    }
    .hover-bg-light:hover {
        background-color: #f8f9fa;
        color: #000 !important;
    }
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e9ecef; 
        border-radius: 4px;
    }
    .cursor-pointer {
        cursor: pointer;
    }
  `]
})
export class SidebarComponent {
  @Input() activeView: string = 'resumen';
  @Output() navigate = new EventEmitter<string>();

  onNavigate(page: string, event: Event) {
    event.preventDefault();
    this.navigate.emit(page);
  }
}
