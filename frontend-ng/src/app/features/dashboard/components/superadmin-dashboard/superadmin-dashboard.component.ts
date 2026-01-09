import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagosSuscripcionListComponent } from '../pagos-suscripcion-list/pagos-suscripcion-list.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { StatCardComponent } from '../widgets/stat-card/stat-card.component';
import { EmpresasListComponent } from '../empresas-list/empresas-list.component';
import { VendedoresListComponent } from '../vendedores-list/vendedores-list.component';
import { ComisionesListComponent } from '../comisiones-list/comisiones-list.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, HeaderComponent, StatCardComponent, EmpresasListComponent, PagosSuscripcionListComponent, VendedoresListComponent, ComisionesListComponent],
  template: `
    <div class="d-flex min-vh-100" style="background-color: #f8f9fa; font-family: 'Inter', system-ui, sans-serif;">
      <app-sidebar [activeView]="currentView()" (navigate)="onNavigate($event)"></app-sidebar>
      
      <div class="flex-grow-1 d-flex flex-column h-100" style="overflow-y: auto;">
        
        <div class="p-4 p-lg-5">
            <!-- Dashboard Content -->
            @if (currentView() === 'empresas') {
                <app-empresas-list></app-empresas-list>
            } @else if (currentView() === 'pagos') {
                <app-pagos-suscripcion-list></app-pagos-suscripcion-list>
            } @else if (currentView() === 'vendedores') {
                <app-vendedores-list></app-vendedores-list>
            } @else if (currentView() === 'comisiones') {
                <app-comisiones-list></app-comisiones-list>
            }
        </div>
      </div>
    </div>
  `
})
export class SuperadminDashboardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentView = signal<string>('empresas');

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['view']) {
        this.currentView.set(params['view']);
      } else {
        // Redirect to empresas view if no view is specified
        this.onNavigate('empresas');
      }
    });
  }

  onNavigate(view: string) {
    this.currentView.set(view);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view },
      queryParamsHandling: 'merge'
    });
  }
}
