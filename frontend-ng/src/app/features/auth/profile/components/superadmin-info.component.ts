import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-superadmin-info',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- Placeholder for specific superadmin stats or info -->
     <div class="d-flex justify-content-between py-2 border-bottom">
        <span class="fw-medium text-secondary">Nivel de Acceso</span>
        <span class="badge bg-primary">TOTAL</span>
     </div>
  `
})
export class SuperadminInfoComponent {
    @Input() user!: any;
}
