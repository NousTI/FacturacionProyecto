import { Component, ViewChild, ChangeDetectorRef, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { R031GlobalComponent } from './components/r-031-global/r-031-global.component';
import { R032ComisionesComponent } from './components/r-032-comisiones/r-032-comisiones.component';
import { R033UsoComponent } from './components/r-033-uso/r-033-uso.component';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { SuperAdminFiltersComponent } from './components/super-admin-filters.component';

type Tab = 'global' | 'comisiones' | 'uso';

@Component({
  selector: 'app-super-admin-reportes',
  standalone: true,
  imports: [
    CommonModule,
    R031GlobalComponent,
    R032ComisionesComponent,
    R033UsoComponent,
    SuperAdminFiltersComponent,
    ToastComponent
  ],
  template: `
<div class="reportes-page-wrapper animate__animated animate__fadeIn">

  <!-- BARRA DE NAVEGACIÓN Y FILTROS UNIFICADA -->
  <div class="header-actions-bar mb-4">
    <div class="tabs-navigation">
      <button class="nav-btn" [class.active]="tabActivo === 'global'" (click)="setTab('global')">
        <i class="bi bi-globe2"></i>
        <span class="nav-label"><span class="nav-name">Reporte Global</span><span class="nav-code">R-031</span></span>
      </button>
      <button class="nav-btn" [class.active]="tabActivo === 'comisiones'" (click)="setTab('comisiones')">
        <i class="bi bi-cash-coin"></i>
        <span class="nav-label"><span class="nav-name">Comisiones</span><span class="nav-code">R-032</span></span>
      </button>
      <button class="nav-btn" [class.active]="tabActivo === 'uso'" (click)="setTab('uso')">
        <i class="bi bi-bar-chart-line"></i>
        <span class="nav-label"><span class="nav-name">Uso por Empresa</span><span class="nav-code">R-033</span></span>
      </button>
    </div>

    <div class="filters-actions">
      <app-super-admin-filters
        [activeTab]="tabActivo"
        [loading]="isLoading"
        [loadingPDF]="isLoadingPDF"
        (filterChange)="onFiltersChanged($event)"
        (generate)="handleGenerate()"
        (export)="handleExport()">
      </app-super-admin-filters>
    </div>
  </div>

  <!-- CONTENIDO DE REPORTES -->
  <div class="report-content-container">
    <!-- ===================== R-031: REPORTE GLOBAL ===================== -->
    <div *ngIf="tabActivo === 'global'" class="animate__animated animate__fadeIn">
      <app-r-031-global #r031></app-r-031-global>
    </div>

    <!-- ===================== R-032: COMISIONES ===================== -->
    <div *ngIf="tabActivo === 'comisiones'" class="animate__animated animate__fadeIn">
      <app-r-032-comisiones #r032></app-r-032-comisiones>
    </div>

    <!-- ===================== R-033: USO POR EMPRESA ===================== -->
    <div *ngIf="tabActivo === 'uso'" class="animate__animated animate__fadeIn">
      <app-r-033-uso #r033></app-r-033-uso>
    </div>
  </div>

</div>
<app-toast></app-toast>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      max-width: 100%;
    }
    .reportes-page-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 0;
      background: transparent;
      overflow: hidden;
      max-width: 100%;
    }
    .header-actions-bar {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
      gap: 1.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    /* TABS MODERNOS */
    .tabs-navigation { display: flex; gap: 0.4rem; flex-shrink: 0; flex-wrap: wrap; }
    .nav-btn {
      background: none; border: none; padding: 0.5rem 1rem; font-weight: 700; color: var(--text-muted);
      border-radius: 12px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
      white-space: nowrap; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;
    }
    .nav-label { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.1; }
    .nav-name  { font-size: 0.82rem; font-weight: 700; }
    .nav-code  { font-size: 0.62rem; font-weight: 600; opacity: 0.55; letter-spacing: 0.03em; }
    .nav-btn.active { background: var(--primary-color); color: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .nav-btn:not(.active):hover { background: var(--status-neutral-bg); color: var(--text-main); }

    .report-content-container {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 4px; /* Espacio para scroll */
    }
  `]
})
export class SuperAdminReportesPage implements OnInit, AfterViewInit {
  @ViewChild('r031') r031!: R031GlobalComponent;
  @ViewChild('r032') r032!: R032ComisionesComponent;
  @ViewChild('r033') r033!: R033UsoComponent;

  tabActivo: Tab = 'global';
  currentFilters: any = {};
  isLoading = false;
  isLoadingPDF = false;
  private pdfPoll: any = null;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.syncFiltersToActiveComponent();
      this.handleGenerate();
    }, 100);
  }

  setTab(tab: Tab) {
    if (this.tabActivo === tab) return;
    this.tabActivo = tab;
    // Limpiar spinner PDF al cambiar de sección
    if (this.pdfPoll) { clearInterval(this.pdfPoll); this.pdfPoll = null; }
    this.isLoadingPDF = false;
    this.cd.detectChanges(); // forzar render del *ngIf antes de acceder al ViewChild
    
    setTimeout(() => {
      this.syncFiltersToActiveComponent();
      this.handleGenerate();
    }, 50);
  }

  onFiltersChanged(filters: any) {
    this.currentFilters = filters;
    this.syncFiltersToActiveComponent();
  }

  syncFiltersToActiveComponent() {
    const comp = this.getActiveComponent();
    if (!comp) return;

    // Sincronizar parámetros comunes
    comp.fechaInicio = this.currentFilters.fechaInicio;
    comp.fechaFin = this.currentFilters.fechaFin;
    comp.rangoTipo = this.currentFilters.rangoTipo;

    this.cd.detectChanges();
  }

  handleGenerate() {
    const comp = this.getActiveComponent();
    if (!comp) return;
    this.isLoading = true;
    this.cd.detectChanges();
    comp.generar();
    // Polling liviano: espera hasta que el hijo termine de cargar
    const poll = setInterval(() => {
      if (!comp.loading) {
        this.isLoading = false;
        this.cd.detectChanges();
        clearInterval(poll);
      }
    }, 100);
    // Timeout de seguridad: si tarda más de 30s, libera el spinner
    setTimeout(() => { clearInterval(poll); this.isLoading = false; this.cd.detectChanges(); }, 30000);
  }

  handleExport() {
    const comp = this.getActiveComponent();
    if (!comp) return;
    if (this.pdfPoll) { clearInterval(this.pdfPoll); this.pdfPoll = null; }
    this.isLoadingPDF = true;
    this.cd.detectChanges();
    comp.exportarPDF();
    this.pdfPoll = setInterval(() => {
      if (!comp.loadingPDF) {
        this.isLoadingPDF = false;
        this.cd.detectChanges();
        clearInterval(this.pdfPoll);
        this.pdfPoll = null;
      }
    }, 100);
    setTimeout(() => {
      if (this.pdfPoll) { clearInterval(this.pdfPoll); this.pdfPoll = null; }
      this.isLoadingPDF = false;
      this.cd.detectChanges();
    }, 60000);
  }

  private getActiveComponent(): any {
    if (this.tabActivo === 'global') return this.r031;
    if (this.tabActivo === 'comisiones') return this.r032;
    if (this.tabActivo === 'uso') return this.r033;
    return null;
  }
}
