import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-status-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal-backdrop-custom">
      <div class="card p-4 text-center shadow-lg" style="width: 90%; max-width: 400px; border-radius: 12px;">
        <div class="display-3 mb-3" [class.text-success]="type() === 'success'" [class.text-danger]="type() === 'error'">
          <i [class]="type() === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
        </div>
        <h3 class="mb-2 text-dark">{{ type() === 'success' ? '¡Éxito!' : 'Error' }}</h3>
        <p class="text-secondary mb-4">{{ message() }}</p>
        <button class="btn btn-dark w-100 fw-bold py-2" (click)="close.emit()">
          Entendido
        </button>
      </div>
    </div>
  `,
    styles: [`
    .modal-backdrop-custom {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1050;
    }
  `]
})
export class StatusModalComponent {
    type = input<'success' | 'error'>('success');
    message = input.required<string>();
    close = output<void>();
}
