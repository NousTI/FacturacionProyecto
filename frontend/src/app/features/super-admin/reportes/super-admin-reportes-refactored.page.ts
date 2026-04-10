import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { R031GlobalComponent } from './components/r-031-global/r-031-global.component';
import { R032ComisionesComponent } from './components/r-032-comisiones/r-032-comisiones.component';
import { R033UsoComponent } from './components/r-033-uso/r-033-uso.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';

type Tab = 'global' | 'comisiones' | 'uso';

@Component({
  selector: 'app-super-admin-reportes',
  standalone: true,
  imports: [
    CommonModule,
    R031GlobalComponent,
    R032ComisionesComponent,
    R033UsoComponent,
    ToastComponent
  ],
  template: `
<div class="reportes-wrap animate__animated animate__fadeIn">

  <!-- TABS -->
  <div class="tabs-bar mb-4">
    <button class="tab-btn" [class.active]="tabActivo === 'global'" (click)="setTab('global')">
      <i class="bi bi-globe2 me-2"></i>Reporte Global
    </button>
    <button class="tab-btn" [class.active]="tabActivo === 'comisiones'" (click)="setTab('comisiones')">
      <i class="bi bi-cash-coin me-2"></i>Comisiones
    </button>
    <button class="tab-btn" [class.active]="tabActivo === 'uso'" (click)="setTab('uso')">
      <i class="bi bi-bar-chart-line me-2"></i>Uso por Empresa
    </button>
  </div>

  <!-- ===================== R-031: REPORTE GLOBAL ===================== -->
  <div *ngIf="tabActivo === 'global'">
    <app-r-031-global></app-r-031-global>
  </div>

  <!-- ===================== R-032: COMISIONES ===================== -->
  <div *ngIf="tabActivo === 'comisiones'">
    <app-r-032-comisiones></app-r-032-comisiones>
  </div>

  <!-- ===================== R-033: USO POR EMPRESA ===================== -->
  <div *ngIf="tabActivo === 'uso'">
    <app-r-033-uso></app-r-033-uso>
  </div>

</div>
<app-toast></app-toast>
  `,
  styles: [`
    .reportes-wrap { padding: 0.5rem 0; }

    /* TABS */
    .tabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0;
    }
    .tab-btn {
      background: none;
      border: none;
      padding: 0.75rem 1.25rem;
      font-weight: 600;
      font-size: 0.9rem;
      color: #64748b;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      border-radius: 0;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: #161d35; }
    .tab-btn.active { color: #161d35; border-bottom-color: #161d35; }
  `]
})
export class SuperAdminReportesPage {

  tabActivo: Tab = 'global';

  setTab(tab: Tab) {
    this.tabActivo = tab;
  }
}
