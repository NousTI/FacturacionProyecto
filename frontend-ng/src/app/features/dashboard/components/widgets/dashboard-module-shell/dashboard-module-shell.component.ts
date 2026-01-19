import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-module-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="module-shell animate-fade-in">
        <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .module-shell {
      padding: 0.5rem 1.5rem 5rem 1.5rem;
      max-width: 100%;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      .module-shell {
        padding: 1.5rem 1rem;
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .module-content {
      /* Base for all standard layouts */
      display: block;
    }
  `]
})
export class DashboardModuleShellComponent {
  @Input() loading: boolean = false;
}
