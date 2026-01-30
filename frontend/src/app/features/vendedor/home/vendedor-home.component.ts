import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-vendedor-home',
  standalone: true,
  imports: [SharedModule],
  template: `
    <app-maintenance 
      [moduleName]="'Dashboard del Vendedor'" 
      [description]="'Este módulo está en construcción. Próximamente tendrás acceso a tus estadísticas y herramientas.'">
    </app-maintenance>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class VendedorHomeComponent { }
