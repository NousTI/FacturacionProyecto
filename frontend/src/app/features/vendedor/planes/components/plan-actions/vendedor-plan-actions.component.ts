import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-vendedor-plan-actions',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="actions-container mb-4">
      <div class="search-wrapper">
        <i class="bi bi-search search-icon"></i>
        <input 
          type="text" 
          class="form-control premium-search" 
          placeholder="Buscar planes por nombre o descripción..."
          [ngModel]="searchQuery"
          (ngModelChange)="searchQueryChange.emit($event)"
        >
      </div>

      <div class="button-group">
        <!-- Restricted: No "Nuevo Plan" button for vendors -->
        <div class="info-badge-premium">
          <i class="bi bi-info-circle me-2"></i>
          Catálogo de Planes
        </div>
      </div>
    </div>
  `,
    styles: [`
    .actions-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
    }
    .search-wrapper {
      position: relative;
      flex: 1;
      max-width: 500px;
    }
    .search-icon {
      position: absolute;
      left: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 1.1rem;
    }
    .premium-search {
      padding: 0.85rem 1.25rem 0.85rem 3.25rem;
      border-radius: 16px;
      border: 1px solid #f1f5f9;
      background: white;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }
    .premium-search:focus {
      border-color: #161d35;
      box-shadow: 0 4px 20px rgba(22, 29, 53, 0.08);
      outline: none;
    }
    .button-group {
      display: flex;
      gap: 0.75rem;
    }
    .info-badge-premium {
      background: rgba(22, 29, 53, 0.05);
      color: #161d35;
      padding: 0.85rem 1.75rem;
      border-radius: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      font-size: 0.9rem;
      border: 1px solid rgba(22, 29, 53, 0.1);
    }
  `]
})
export class VendedorPlanActionsComponent {
    @Input() searchQuery: string = '';
    @Output() searchQueryChange = new EventEmitter<string>();
}
