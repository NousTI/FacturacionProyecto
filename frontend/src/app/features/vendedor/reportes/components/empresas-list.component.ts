import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container animate__animated animate__fadeIn">
      <div class="table-header-info">
        <h5 class="mb-0">Directorio de Clientes</h5>
        <span class="badge bg-primary-light text-primary">{{ data?.length || 0 }} Empresas Encontradas</span>
      </div>
      
      <div class="table-responsive">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>RUC</th>
              <th>Razón Social</th>
              <th>Nombre Comercial</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Registro</th>
              <th class="text-center">Usuarios</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let e of data">
              <td class="fw-bold">{{ e.ruc }}</td>
              <td>{{ e.razon_social }}</td>
              <td class="text-muted small">{{ e.nombre_comercial }}</td>
              <td>{{ e.email }}</td>
              <td>
                <span class="badge-status" [class.active]="e.activo">
                  {{ e.activo ? 'ACTIVA' : 'INACTIVA' }}
                </span>
              </td>
              <td class="small">{{ e.fecha_registro }}</td>
              <td class="text-center">
                <span class="user-count">{{ e.usuarios_registrados }}</span>
              </td>
            </tr>
            <tr *ngIf="!data || data.length === 0">
              <td colspan="7" class="text-center py-5">
                <i class="bi bi-inbox fs-1 d-block mb-2 text-muted"></i>
                <p class="text-muted">No se encontraron empresas en este rango de fechas.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-container { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 1.5rem; }
    .table-header-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    
    .custom-table { margin: 0; }
    .custom-table thead th { 
      background: #f8fafc; color: #64748b; font-size: 0.7rem; font-weight: 800; 
      text-transform: uppercase; letter-spacing: 0.05em; padding: 1rem; border: none;
    }
    .custom-table tbody td { padding: 1rem; vertical-align: middle; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; }
    
    .bg-primary-light { background: #eff6ff; }
    
    .badge-status {
      padding: 0.35rem 0.75rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700;
      background: #fee2e2; color: #dc2626;
    }
    .badge-status.active { background: #dcfce7; color: #16a34a; }
    
    .user-count {
      background: #f1f5f9; padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; color: #475569;
    }
  `]
})
export class EmpresasListComponent {
  @Input() data: any[] = [];
}
