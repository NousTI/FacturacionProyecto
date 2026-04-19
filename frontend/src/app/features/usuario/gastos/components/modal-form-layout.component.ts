import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-form-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-form-layout">
      <!-- HEADER FIJO -->
      <div class="modal-form-header">
        <h4 class="modal-form-title">{{ title }}</h4>
      </div>

      <!-- BODY SCROLLABLE -->
      <div class="modal-form-body">
        <ng-content></ng-content>
      </div>

      <!-- FOOTER FIJO -->
      <div class="modal-form-footer">
        <div class="footer-actions">
          <button *ngIf="!viewOnly" type="button" class="btn-cancel" (click)="onCancel.emit()" [disabled]="loading">
            Cancelar
          </button>
          <button *ngIf="!viewOnly" type="submit" form="formContent" class="btn-save" [disabled]="loading || submitDisabled">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            {{ submitLabel }}
          </button>
          <button *ngIf="viewOnly" type="button" class="btn-save" (click)="onCancel.emit()">
            {{ submitLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .modal-form-layout {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      min-height: 0;
      width: 100%;
      background: white;
    }

    .modal-form-header {
      padding: 1.5rem;
      flex-shrink: 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .modal-form-title {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--primary-color);
      margin: 0;
    }

    .modal-form-body {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 1.5rem;
      scrollbar-width: thin;
      scrollbar-color: #e2e8f0 transparent;
    }

    .modal-form-body::-webkit-scrollbar {
      width: 6px;
    }

    .modal-form-body::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }

    .modal-form-footer {
      padding: 1.5rem;
      border-top: 1px solid #f1f5f9;
      flex-shrink: 0;
      background: #f8fafc;
    }

    .footer-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }

    .btn-cancel {
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #f1f5f9;
      color: #1e293b;
    }

    .btn-cancel:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-save {
      background: #111827;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-save:hover:not(:disabled) {
      background: #1f2937;
      transform: translateY(-2px);
    }

    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner-border {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      vertical-align: text-bottom;
      border: 0.25em solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spinner-border 0.75s linear infinite;
    }

    .spinner-border-sm {
      width: 0.875rem;
      height: 0.875rem;
      border-width: 0.2em;
    }

    @keyframes spinner-border {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ModalFormLayoutComponent {
  @Input() title = '';
  @Input() submitLabel = 'Guardar';
  @Input() loading = false;
  @Input() submitDisabled = false;
  @Input() viewOnly = false;
  @Output() onCancel = new EventEmitter<void>();
}
