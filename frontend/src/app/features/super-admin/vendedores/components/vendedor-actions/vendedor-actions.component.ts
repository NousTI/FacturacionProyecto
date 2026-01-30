import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vendedor-actions',
  template: `
    <div class="actions-surface shadow-premium">
      <div class="row align-items-center g-3">
        
        <!-- Search Bar -->
        <div class="col-md-8">
          <div class="search-premium-group">
            <i class="bi bi-search search-icon"></i>
            <input 
              type="text" 
              class="form-control search-input-premium" 
              placeholder="Buscar por nombre, email o DNI..."
              [ngModel]="searchQuery"
              (ngModelChange)="searchQueryChange.emit($event)"
            >
            <div class="search-badge" *ngIf="searchQuery">Vendedores</div>
          </div>
        </div>

        <!-- Main Action Button -->
        <div class="col-md-4 text-end">
          <button class="btn-premium-primary w-100" (click)="onCreate.emit()">
            <i class="bi bi-person-plus-fill me-2"></i>
            Registrar Vendedor
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .actions-surface {
      background: #ffffff;
      padding: 0.75rem 1.5rem;
      border-radius: 20px;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    .search-premium-group {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 1.25rem;
      color: #94a3b8;
      font-size: 1.1rem;
    }
    .search-input-premium {
      padding: 0 1rem 0 3.5rem;
      height: 40px;
      border-radius: 16px;
      background: #f8fafc;
      border: 1px solid rgba(0, 0, 0, 0.05);
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.2s;
      width: 100%;
    }
    .search-input-premium:focus {
      background: #ffffff;
      border-color: #161d35;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
    }
    .search-badge {
      position: absolute;
      right: 1rem;
      background: #161d35;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 8px;
      text-transform: uppercase;
    }
    .btn-premium-primary {
      background: #161d35;
      color: #ffffff;
      border: 1.5px solid transparent;
      padding: 0 1.5rem;
      height: 40px;
      border-radius: 16px;
      font-weight: 700;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-premium-primary:hover {
      background: #0f172a;
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(22, 29, 53, 0.2);
    }
    .shadow-premium {
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VendedorActionsComponent {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onCreate = new EventEmitter<void>();
}
