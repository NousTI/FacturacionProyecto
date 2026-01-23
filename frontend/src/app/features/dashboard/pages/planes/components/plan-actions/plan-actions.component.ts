import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-plan-actions',
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
        <button class="btn btn-history" (click)="onViewHistory.emit()">
          <i class="bi bi-clock-history me-2"></i>
          Historial
        </button>
        <button class="btn btn-create-premium" (click)="onCreate.emit()">
          <i class="bi bi-plus-lg me-2"></i>
          Nuevo Plan
        </button>
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
      border-color: #6366f1;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.08);
      outline: none;
    }
    .button-group {
      display: flex;
      gap: 0.75rem;
    }
    .btn-create-premium {
      background: #161d35;
      color: white;
      padding: 0.85rem 1.75rem;
      border-radius: 16px;
      font-weight: 700;
      border: none;
      display: flex;
      align-items: center;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }
    .btn-create-premium:hover {
      background: #000;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
    .btn-history {
      background: white;
      color: #64748b;
      padding: 0.85rem 1.5rem;
      border-radius: 16px;
      font-weight: 700;
      border: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      transition: all 0.3s ease;
      font-size: 0.9rem;
    }
    .btn-history:hover {
      background: #f8fafc;
      color: #1e293b;
      border-color: #e2e8f0;
    }
  `],
    standalone: true,
    imports: [CommonModule, FormsModule]
})
export class PlanActionsComponent {
    @Input() searchQuery: string = '';
    @Output() searchQueryChange = new EventEmitter<string>();
    @Output() onCreate = new EventEmitter<void>();
    @Output() onViewHistory = new EventEmitter<void>();
}
