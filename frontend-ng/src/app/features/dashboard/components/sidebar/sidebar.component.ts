import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="d-flex flex-column flex-shrink-0 p-3 bg-white h-100 border-end" style="width: 250px;">
      <a href="/" class="d-flex align-items-center mb-4 mb-md-0 me-md-auto link-dark text-decoration-none">
        <div class="bg-dark text-white rounded p-1 me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
            <span class="fw-bold fs-5">D</span>
        </div>
        <span class="fs-4 fw-bold">DealDeck</span>
      </a>
      
      <div class="overflow-auto mt-4 custom-scrollbar" style="flex: 1;">
          
          <!-- MENU -->
          <div class="mb-4">
            <span class="text-uppercase text-secondary fw-bold small ps-3">Menu</span>
            <ul class="nav nav-pills flex-column mt-2">
              <!-- Removed Dashboard per user request -->
              <li class="nav-item mb-1">
                <a href="#" class="nav-link link-dark d-flex align-items-center text-secondary hover-bg-light">
                  <i class="bi bi-file-text me-2"></i>
                  Report
                </a>
              </li>
              <li class="nav-item mb-1">
                <a href="#" class="nav-link link-dark d-flex align-items-center text-secondary hover-bg-light">
                  <i class="bi bi-box-seam me-2"></i>
                  Products
                </a>
              </li>
              <li class="nav-item mb-1">
                <a href="#" class="nav-link link-dark d-flex align-items-center text-secondary hover-bg-light">
                  <i class="bi bi-person me-2"></i>
                  Consumer
                </a>
              </li>
              <!-- Added for User Request -->
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
                  Equipo Ventas
                </a>
              </li>
            </ul>
          </div>
          <!-- (Rest of template remains same) -->
          <!-- FINANCIAL -->
          <div class="mb-4">
            <span class="text-uppercase text-secondary fw-bold small ps-3">Financial</span>
            <ul class="nav nav-pills flex-column mt-2">
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('pagos', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'pagos'"
                   [ngClass]="activeView === 'pagos' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'pagos' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-wallet2 me-2"></i>
                  Pagos Suscripción
                </a>
              </li>
              <li class="nav-item mb-1">
                <a href="#" (click)="onNavigate('comisiones', $event)" 
                   class="nav-link d-flex align-items-center cursor-pointer"
                   [class.active]="activeView === 'comisiones'"
                   [ngClass]="activeView === 'comisiones' ? 'text-white' : 'link-dark text-secondary hover-bg-light'"
                   [style.background-color]="activeView === 'comisiones' ? '#5a4bda' : 'transparent'">
                  <i class="bi bi-percent me-2"></i>
                  Comisiones
                </a>
              </li>
            </ul>
        </div>

           <!-- TOOLS -->
           <div class="mb-4">
            <span class="text-uppercase text-secondary fw-bold small ps-3">Tools</span>
            <ul class="nav nav-pills flex-column mt-2">
              <li class="nav-item mb-1">
                <a href="#" class="nav-link link-dark d-flex align-items-center text-secondary hover-bg-light">
                  <i class="bi bi-gear me-2"></i>
                  Settings
                </a>
              </li>
              <li class="nav-item mb-1">
                <a href="#" class="nav-link link-dark d-flex align-items-center text-secondary hover-bg-light">
                  <i class="bi bi-chat-left-text me-2"></i>
                  Feedback
                </a>
              </li>
               <li class="nav-item mb-1">
                <a href="#" class="nav-link link-dark d-flex align-items-center text-secondary hover-bg-light">
                  <i class="bi bi-question-circle me-2"></i>
                  Help
                </a>
              </li>
            </ul>
          </div>

      </div>

      <!-- UPGRADE CARD -->
      <div class="card border-0 bg-dark text-white rounded-4 p-3 mt-3 shadow">
        <div class="mb-2">
            <span class="badge bg-secondary bg-opacity-25 text-warning p-2 rounded-3">
                <i class="bi bi-lightning-fill"></i>
            </span>
        </div>
        <h6 class="fw-bold mb-1">Upgrade Pro</h6>
        <p class="small text-white-50 mb-3" style="font-size: 0.8rem;">Get full access to all features</p>
        <button class="btn btn-primary w-100 fw-bold rounded-3" style="background-color: #5a4bda; border: none;">
            Upgrade $30
        </button>
      </div>

    </div>
  `,
  styles: [`
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
  @Input() activeView: string = 'dashboard';
  @Output() navigate = new EventEmitter<string>();

  onNavigate(page: string, event: Event) {
    event.preventDefault();
    this.navigate.emit(page);
  }
}
