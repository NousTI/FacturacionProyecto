import { Component, Input, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="rt-wrap" #trigger
          (mouseenter)="show()"
          (mouseleave)="hide()">
      <i [class]="'bi ' + icon + ' rt-icon'"></i>
    </span>

    <div class="rt-box" *ngIf="visible"
         [style.top.px]="top"
         [style.left.px]="left">
      <div class="rt-content">{{ message }}</div>
    </div>
  `,
  styles: [`
    .rt-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      margin-left: 6px;
      cursor: help;
    }

    .rt-icon {
      color: #94a3b8;
      font-size: 0.8rem;
      transition: color 0.2s;
    }
    .rt-wrap:hover .rt-icon { color: #6366f1; }

    .rt-box {
      position: fixed;
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 10px;
      padding: 0.6rem 0.9rem;
      font-size: 0.75rem;
      z-index: 99999;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
      min-width: 180px;
      max-width: 260px;
      pointer-events: none;
      white-space: pre-line;
    }

    .rt-content {
      color: #f1f5f9;
      font-weight: 600;
      line-height: 1.4;
    }
  `]
})
export class InfoTooltipComponent {
  @Input() message: string = '';
  @Input() icon: string = 'bi-info-circle';

  @ViewChild('trigger') trigger!: ElementRef;

  visible = false;
  top = 0;
  left = 0;

  show() {
    const rect: DOMRect = this.trigger.nativeElement.getBoundingClientRect();
    // Mostrar encima del ícono; si no hay espacio arriba, mostrar abajo
    const tooltipHeight = 60;
    const tooltipWidth = 200;
    this.top = rect.top - tooltipHeight - 8 < 0
      ? rect.bottom + 8
      : rect.top - tooltipHeight - 8;
    this.left = Math.min(
      rect.left + rect.width / 2 - tooltipWidth / 2,
      window.innerWidth - tooltipWidth - 8
    );
    this.left = Math.max(this.left, 8);
    this.visible = true;
  }

  hide() {
    this.visible = false;
  }
}
