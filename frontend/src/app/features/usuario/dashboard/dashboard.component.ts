import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaintenanceComponent } from '../../../shared/components/maintenance/maintenance.component';
import { UiService } from '../../../shared/services/ui.service';

@Component({
  selector: 'app-usuario-dashboard',
  standalone: true,
  imports: [CommonModule, MaintenanceComponent],
  template: `
    <app-maintenance 
      moduleName="Dashboard" 
      description="Resumen personal: Facturas emitidas, alertas y accesos rápidos.">
    </app-maintenance>
  `
})
export class DashboardComponent implements OnInit {
  constructor(private uiService: UiService) { }

  ngOnInit() {
    this.uiService.setPageHeader('Dashboard', 'Resumen general de tu actividad');
  }
}
