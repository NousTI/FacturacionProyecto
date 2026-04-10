import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
}

@Component({
  selector: 'app-auditoria-paginacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card border-0 shadow-sm mt-4">
      <div class="card-body py-3">
        <div class="row align-items-center">
          <div class="col-md-6">
            <div class="d-flex align-items-center gap-2">
              <label class="small fw-bold text-muted text-uppercase mb-0">Registros por página:</label>
              <select
                class="form-select form-select-sm"
                style="width: auto;"
                [(ngModel)]="pagination.pageSize"
                (change)="onPageSizeChange()">
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
            </div>
          </div>
          <div class="col-md-6">
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-muted">
                Mostrando <strong>{{ startItem }}</strong> a <strong>{{ endItem }}</strong> de <strong>{{ pagination.totalItems }}</strong> registros
              </small>
              <nav aria-label="pagination">
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item" [class.disabled]="pagination.currentPage === 1">
                    <button class="page-link" (click)="onPreviousPage()" [disabled]="pagination.currentPage === 1">
                      <i class="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  <li class="page-item active">
                    <span class="page-link">{{ pagination.currentPage }}</span>
                  </li>
                  <li class="page-item" [class.disabled]="!hasNextPage">
                    <button class="page-link" (click)="onNextPage()" [disabled]="!hasNextPage">
                      <i class="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination-sm .page-link {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
  `]
})
export class AuditoriaPaginacionComponent {
  @Input() pagination: PaginationState = {
    currentPage: 1,
    pageSize: 25,
    totalItems: 0
  };
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get startItem(): number {
    return (this.pagination.currentPage - 1) * this.pagination.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.pagination.currentPage * this.pagination.pageSize, this.pagination.totalItems);
  }

  get hasNextPage(): boolean {
    return this.pagination.currentPage * this.pagination.pageSize < this.pagination.totalItems;
  }

  onPreviousPage() {
    if (this.pagination.currentPage > 1) {
      this.pageChange.emit(this.pagination.currentPage - 1);
    }
  }

  onNextPage() {
    if (this.hasNextPage) {
      this.pageChange.emit(this.pagination.currentPage + 1);
    }
  }

  onPageSizeChange() {
    this.pageSizeChange.emit(this.pagination.pageSize);
  }
}
