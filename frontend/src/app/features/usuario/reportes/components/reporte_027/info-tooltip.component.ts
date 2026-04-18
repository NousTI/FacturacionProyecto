import { Component, Input, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="it-wrap"
          (mouseenter)="show($event)"
          (mouseleave)="hide()">
      <i class="bi bi-info-circle-fill it-icon"></i>
    </span>
  `,
  styles: [`
    .it-wrap { display: inline-flex; align-items: center; margin-left: 4px; cursor: help; }
    .it-icon { color: #94a3b8; font-size: 0.8rem; transition: color 0.2s; }
    .it-wrap:hover .it-icon { color: #6366f1; }
  `]
})
export class InfoTooltipComponent implements OnDestroy {
  @Input() text = '';
  @Input() label = '';

  private div: HTMLDivElement | null = null;

  show(event: MouseEvent) {
    this.hide();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    // Crear div directamente en body
    const d = document.createElement('div');
    d.style.cssText = `
      position:fixed; background:#1e293b; color:#e2e8f0;
      border-radius:10px; padding:0.6rem 0.9rem; font-size:0.75rem;
      z-index:99999; box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);
      min-width:220px; max-width:320px; pointer-events:none;
      white-space:normal; line-height:1.5; top:-9999px; left:0;
    `;
    if (this.label) {
      const title = document.createElement('p');
      title.style.cssText = 'font-weight:700;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em;color:#94a3b8;margin:0 0 4px;';
      title.textContent = this.label;
      d.appendChild(title);
    }
    const val = document.createElement('span');
    val.style.cssText = 'color:#f1f5f9;font-weight:500;';
    val.textContent = this.text;
    d.appendChild(val);
    document.body.appendChild(d);
    this.div = d;

    // Medir y posicionar
    const h = d.offsetHeight;
    const w = d.offsetWidth;
    const margin = 8;
    const vpWidth = window.innerWidth;

    let left = rect.left + rect.width / 2 - w / 2;
    if (left + w + margin > vpWidth) left = vpWidth - w - margin;
    if (left < margin) left = margin;

    const topAbove = rect.top - h - margin;
    const top = topAbove >= 0 ? topAbove : rect.bottom + margin;

    d.style.top = top + 'px';
    d.style.left = left + 'px';
  }

  hide() {
    if (this.div) {
      document.body.removeChild(this.div);
      this.div = null;
    }
  }

  ngOnDestroy() { this.hide(); }
}
