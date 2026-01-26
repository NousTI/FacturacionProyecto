import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comisiones-actions',
  template: `
    <section class="module-actions mb-4">
      <div class="actions-bar-container shadow-sm p-3 rounded-4">
        <div class="row align-items-center g-3">
          <div class="col-md-8">
            <div class="search-box-premium">
              <i class="bi bi-search"></i>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="onSearchChange($event)"
                placeholder="Buscar por vendedor o concepto..." 
                class="form-control-premium-search"
              >
            </div>
          </div>

        </div>
      </div>
    </section>
  `,
  styles: [`
    .actions-bar-container {
      background: #ffffff;
      border: 1px solid #f1f5f9;
    }
    .search-box-premium {
      position: relative;
      width: 100%;
    }
    .search-box-premium i {
      position: absolute;
      left: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: #161d35;
      font-size: 1.1rem;
    }
    .form-control-premium-search {
      background: #f8fafc;
      border: 1.5px solid #f1f5f9;
      border-radius: 14px;
      padding: 0.75rem 1.25rem 0.75rem 3.25rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: #161d35;
      transition: all 0.2s;
    }
    .form-control-premium-search:focus {
      background: #ffffff;
      border-color: #161d35;
      box-shadow: 0 0 0 4px rgba(22, 29, 53, 0.05);
      outline: none;
    }
    .btn-system-action {
      background: #161d35;
      color: #ffffff;
      border: none;
      padding: 0.8rem 2rem;
      border-radius: 14px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-system-action:hover {
      background: #232d4d;
      transform: translateY(-1px);
      box-shadow: 0 10px 15px -3px rgba(22, 29, 53, 0.2);
    }
    .form-control-premium-search {
      width: 100%;
      background: #f8fafc;
      border: 1.5px solid #f1f5f9;
      border-radius: 14px;
      padding: 0.75rem 1.25rem 0.75rem 3.25rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: #161d35;
      transition: all 0.2s;
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ComisionesActionsComponent {
  @Input() searchQuery: string = '';
  @Output() searchQueryChange = new EventEmitter<string>();
  @Output() onRegisterPayment = new EventEmitter<void>();

  onSearchChange(value: string) {
    this.searchQueryChange.emit(value);
  }
}
