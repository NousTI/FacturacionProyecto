import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

@Component({
  selector: 'app-vendedor-paginacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagination-premium-container">
      <div class="d-flex align-items-center justify-content-between px-4 py-3">
        <div class="d-flex align-items-center gap-3">
          <span class="text-muted fw-600" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Registros por página:</span>
          <select class="form-select-premium-sm" [(ngModel)]="pagination.pageSize" (change)="onPageSizeChange()">
            <option [value]="10">10</option>
            <option [value]="25">25</option>
            <option [value]="50">50</option>
            <option [value]="100">100</option>
          </select>
        </div>
        <div class="text-center">
          <span class="text-muted fw-500" style="font-size: 0.85rem;">
            Mostrando <strong class="text-dark">{{ startItem }} - {{ endItem }}</strong> de <strong class="text-dark">{{ pagination.totalItems }}</strong> registros
          </span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn-nav-premium" [disabled]="pagination.currentPage === 1" (click)="onPreviousPage()" title="Anterior">
            <i class="bi bi-chevron-left"></i>
          </button>
          <div class="page-indicator-premium">{{ pagination.currentPage }}</div>
          <button class="btn-nav-premium" [disabled]="!hasNextPage" (click)="onNextPage()" title="Siguiente">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .pagination-premium-container {
      background: var(--bg-main, #ffffff);
      border-top: 1px solid var(--border-color, #f1f5f9);
    }
    .form-select-premium-sm {
      padding: 0.4rem 2rem 0.4rem 1rem; border-radius: 10px;
      border: 1px solid #e2e8f0; background-color: #f8fafc;
      font-size: 0.85rem; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.2s;
    }
    .form-select-premium-sm:focus { border-color: var(--primary-color, var(--primary-color)); outline: none; }
    .btn-nav-premium {
      width: 38px; height: 38px; border-radius: 10px;
      border: 1px solid #e2e8f0; background: white;
      display: flex; align-items: center; justify-content: center;
      color: #64748b; transition: all 0.2s; cursor: pointer;
    }
    .btn-nav-premium:hover:not(:disabled) { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
    .btn-nav-premium:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-indicator-premium {
      min-width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: var(--primary-color, var(--primary-color)); color: white;
      font-weight: 700; font-size: 0.9rem; padding: 0 0.75rem;
    }
    .fw-600 { font-weight: 600; }
    .fw-500 { font-weight: 500; }
  `]
})
export class VendedorPaginacionComponent {
  @Input() pagination: PaginationState = { currentPage: 1, pageSize: 25, totalItems: 0 };
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get startItem(): number {
    if (this.pagination.totalItems === 0) return 0;
    return (this.pagination.currentPage - 1) * this.pagination.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.pagination.currentPage * this.pagination.pageSize, this.pagination.totalItems);
  }

  get hasNextPage(): boolean {
    return this.pagination.currentPage * this.pagination.pageSize < this.pagination.totalItems;
  }

  onPreviousPage() {
    if (this.pagination.currentPage > 1) this.pageChange.emit(this.pagination.currentPage - 1);
  }

  onNextPage() {
    if (this.hasNextPage) this.pageChange.emit(this.pagination.currentPage + 1);
  }

  onPageSizeChange() {
    this.pageSizeChange.emit(+this.pagination.pageSize);
  }
}
