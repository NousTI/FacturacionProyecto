import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5); backdrop-filter: blur(2px);">
      <div class="modal-dialog modal-dialog-centered" [ngClass]="sizeClass">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          
          <!-- Header -->
          <div class="modal-header border-bottom-0 pb-0 pt-4 px-4">
            <h5 class="modal-title fw-bold text-dark">{{ title }}</h5>
            <button type="button" class="btn-close bg-light rounded-circle p-2" (click)="close.emit()" aria-label="Close"></button>
          </div>
          
          <!-- Body -->
          <div class="modal-body p-4 custom-scrollbar">
            <ng-content></ng-content>
          </div>
          
          <!-- Footer -->
          @if (showFooter) {
          <div class="modal-footer border-top-0 pt-0 pb-4 px-4 bg-transparent">
             <ng-content select="[footer]"></ng-content>
          </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar {
        max-height: 80vh;
        overflow-y: auto;
    }
    /* Custom scrollbar styling */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1; 
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #ccc; 
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #bbb; 
    }
  `]
})
export class ModalComponent {
    @Input() title: string = '';
    @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
    @Input() showFooter: boolean = true;
    @Output() close = new EventEmitter<void>();

    get sizeClass(): string {
        return `modal-${this.size}`;
    }
}
