import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center justify-content-center h-100 vh-100 bg-white">
      <div class="text-center animate__animated animate__fadeIn">
        <h1 class="fw-bold text-dark display-3 mb-2">En mantenimiento</h1>
        <p class="fs-4 text-muted">{{ moduleName }} inicial en construcción</p>
      </div>
    </div>
  `,
  styles: []
})
export class MaintenanceComponent implements OnInit {
  moduleName = 'Módulo';

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.data.subscribe(data => {
      if (data['title']) {
        this.moduleName = data['title'];
      }
    });
  }
}
