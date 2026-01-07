import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackService } from './shared/services/feedback.service';
import { LoadingOverlayComponent } from './shared/components/loading-overlay/loading-overlay.component';
import { StatusModalComponent } from './shared/components/status-modal/status-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingOverlayComponent, StatusModalComponent],
  template: `
    <router-outlet></router-outlet>
    
    @if (feedback.isLoading()) {
      <app-loading-overlay [message]="feedback.loadingMessage()"></app-loading-overlay>
    }

    @if (feedback.modalState().isOpen) {
      <app-status-modal 
        [type]="feedback.modalState().type" 
        [message]="feedback.modalState().message"
        (close)="feedback.closeModal()">
      </app-status-modal>
    }
  `
})
export class AppComponent {
  feedback = inject(FeedbackService);
}
