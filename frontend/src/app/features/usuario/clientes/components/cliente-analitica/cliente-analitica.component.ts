import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnaliticaNuevosComponent }   from './tabs/analitica-nuevos/analitica-nuevos.component';
import { AnaliticaTopComponent }       from './tabs/analitica-top/analitica-top.component';
import { AnaliticaInactivosComponent } from './tabs/analitica-inactivos/analitica-inactivos.component';
import { AnaliticaAnalisisComponent }  from './tabs/analitica-analisis/analitica-analisis.component';

type Tab = 'nuevos' | 'top' | 'inactivos' | 'analisis';

@Component({
    selector: 'app-cliente-analitica',
    standalone: true,
    imports: [
        CommonModule,
        AnaliticaNuevosComponent,
        AnaliticaTopComponent,
        AnaliticaInactivosComponent,
        AnaliticaAnalisisComponent,
    ],
    template: `
    <div class="analitica-wrap">
      <div class="tabs-bar">
        <button class="tab-btn" [class.active]="tab === 'nuevos'"    (click)="tab = 'nuevos'">
          <i class="bi bi-person-plus-fill"></i> Clientes Nuevos
        </button>
        <button class="tab-btn" [class.active]="tab === 'top'"       (click)="tab = 'top'">
          <i class="bi bi-trophy-fill"></i> Top Clientes
        </button>
        <button class="tab-btn" [class.active]="tab === 'inactivos'" (click)="tab = 'inactivos'">
          <i class="bi bi-person-dash-fill"></i> Inactivos
        </button>
        <button class="tab-btn" [class.active]="tab === 'analisis'"  (click)="tab = 'analisis'">
          <i class="bi bi-pie-chart-fill"></i> Análisis
        </button>
      </div>

      <div class="tab-body">
        <app-analitica-nuevos    *ngIf="tab === 'nuevos'"></app-analitica-nuevos>
        <app-analitica-top       *ngIf="tab === 'top'"></app-analitica-top>
        <app-analitica-inactivos *ngIf="tab === 'inactivos'"></app-analitica-inactivos>
        <app-analitica-analisis  *ngIf="tab === 'analisis'"></app-analitica-analisis>
      </div>
    </div>
    `,
    styles: [`
    .analitica-wrap {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 20px;
      overflow: hidden;
    }
    .tabs-bar {
      display: flex;
      border-bottom: 1px solid #f1f5f9;
      background: #fafbfc;
      padding: 0 1.5rem;
    }
    .tab-btn {
      padding: 0.9rem 1.2rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: #94a3b8;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .tab-btn:hover  { color: #475569; }
    .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .tab-body { padding: 1.5rem; }
    `]
})
export class ClienteAnaliticaComponent {
    tab: Tab = 'nuevos';
}
