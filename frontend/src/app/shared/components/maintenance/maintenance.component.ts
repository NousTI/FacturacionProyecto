import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center justify-content-center h-100 vh-100 bg-white">
      <div class="text-center animate__animated animate__fadeIn" style="max-width: 600px;">
        <h1 class="fw-bold text-dark display-3 mb-2">En mantenimiento</h1>
        <p class="fs-4 text-primary mb-3">{{ moduleName }}</p>
        <p class="fs-5 text-muted">{{ description }}</p>
      </div>
    </div>
  `,
  styles: []
})
export class MaintenanceComponent implements OnInit {
  @Input() moduleName = 'Módulo';
  @Input() description = 'Este módulo se encuentra actualmente en construcción.';

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.data.subscribe(data => {
      if (data['title']) {
        this.moduleName = data['title'];
      }
      if (data['description']) {
        this.description = data['description'];
      }
    });
  }
}
