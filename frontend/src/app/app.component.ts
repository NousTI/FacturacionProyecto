import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from '../shared/ui/toasts.component';
import { LockOverlayComponent } from './shared/components/lock-overlay/lock-overlay.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, ToastsComponent, LockOverlayComponent],
    template: `
        <router-outlet></router-outlet>
        <app-toasts></app-toasts>
        <app-lock-overlay></app-lock-overlay>
    `
})
export class AppComponent {
    title = 'frontend';
}
