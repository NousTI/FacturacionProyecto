import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestService, TestItem } from './test.service';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container p-4">
      <h2 class="mb-4">Módulo de Prueba (Mockup)</h2>
      
      <div class="card shadow-sm border-0 rounded-4">
        <div class="card-body">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Valor</th>
                <th class="text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of items">
                <td><small class="text-muted">{{ item.id }}</small></td>
                <td class="fw-bold">{{ item.nombre }}</td>
                <td>{{ item.valor | currency:'USD' }}</td>
                <td class="text-center">
                  <span class="badge" [ngClass]="item.activo ? 'bg-success' : 'bg-secondary'">
                    {{ item.activo ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="mt-4 p-3 bg-light rounded text-muted small">
        <i class="bi bi-info-circle me-2"></i>
        Este es un componente de prueba cargado con datos locales.
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      min-height: 400px;
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class TestComponent implements OnInit {
  items: TestItem[] = [];

  constructor(private testService: TestService) { }

  ngOnInit(): void {
    this.testService.getTestItems().subscribe(data => {
      this.items = data;
    });
  }
}
