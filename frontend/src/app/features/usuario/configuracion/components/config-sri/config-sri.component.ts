import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { SriConfigService } from '../../../certificado-sri/services/sri-config.service';
import { ConfigSRI, ActualizarParametrosSRI } from '../../../certificado-sri/models/sri-config.model';
import { AuthFacade } from '../../../../../core/auth/auth.facade';
import { UiService } from '../../../../../shared/services/ui.service';

@Component({
  selector: 'app-config-sri',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-sri-wrapper animate__animated animate__fadeIn">
      
      <!-- LOADING STATE -->
      <div *ngIf="loading" class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-premium mb-3"></div>
          <p class="text-muted fw-bold">Cargando parámetros SRI...</p>
      </div>

      <!-- SETUP VIEW (NO CONFIG or REPLACING) -->
      <div *ngIf="!loading && (!config || isReplacing)" class="setup-view">
          <div class="row justify-content-center">
              <div class="col-12 col-xl-10">
                  <div class="mono-card shadow-sm border-0 bg-light-soft p-4 p-md-5 rounded-4">
                      <div class="text-center mb-5">
                          <div class="icon-circle-large mb-4 mx-auto">
                              <i class="bi bi-shield-lock"></i>
                          </div>
                          <h2 class="h3 fw-900 mb-2">Vincular Firma Digital</h2>
                          <p class="text-muted">Configure su certificado .p12 para emitir comprobantes electrónicos legales.</p>
                      </div>

                      <form (ngSubmit)="triggerUpload()" #uploadForm="ngForm">
                          <div class="upload-area mb-4" 
                               [class.is-dragging]="isDragging"
                               [class.has-file]="fileSelected"
                               (dragover)="onDragOver($event)"
                               (dragleave)="onDragLeave($event)"
                               (drop)="onDrop($event)"
                               (click)="fileInput.click()">
                              <i class="bi mb-3" [class]="fileSelected ? 'bi-check2-circle text-success' : 'bi-cloud-arrow-up'"></i>
                              <h4 class="h6 fw-bold mb-1">{{ fileSelected ? selectedFileName : 'Arrastre o seleccione su certificado' }}</h4>
                              <p class="x-small text-muted mb-0">Formatos permitidos: .p12 o .pfx</p>
                              <input #fileInput type="file" (change)="onFileChange($event)" accept=".p12,.pfx" hidden>
                          </div>

                          <div class="row g-4">
                              <div class="col-md-12">
                                  <label class="label-premium">CONTRASEÑA DE LA FIRMA</label>
                                  <div class="input-premium-wrapper">
                                      <i class="bi bi-key-fill"></i>
                                      <input [type]="showPassword ? 'text' : 'password'" 
                                             class="input-premium" [(ngModel)]="password" name="password" 
                                             placeholder="Ingrese la clave de exportación" required>
                                      <button type="button" class="btn-toggle-eye" (click)="showPassword = !showPassword">
                                          <i class="bi" [class]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                                      </button>
                                  </div>
                              </div>

                              <div class="col-md-6">
                                  <label class="label-premium">AMBIENTE SRI</label>
                                  <select class="select-premium" [(ngModel)]="setupParams.ambiente" name="ambiente" required>
                                      <option value="PRUEBAS">PRUEBAS</option>
                                      <option value="PRODUCCION">PRODUCCION</option>
                                  </select>
                              </div>
                              
                              <div class="col-md-6">
                                  <label class="label-premium">TIPO DE EMISIÓN</label>
                                  <select class="select-premium" [(ngModel)]="setupParams.tipo_emision" name="tipo_emision" required>
                                      <option value="NORMAL">NORMAL</option>
                                      <option value="CONTINGENCIA">CONTINGENCIA</option>
                                  </select>
                              </div>
                          </div>

                          <div class="d-flex gap-3 mt-5">
                              <button *ngIf="isReplacing" type="button" class="btn btn-light-premium py-3 w-50" [disabled]="isSaving" (click)="cancelReplaceBtn()">
                                  CANCELAR
                              </button>
                              <button type="submit" class="btn-premium-dark py-3" [style.width]="isReplacing ? '50%' : '100%'"
                                      [disabled]="isSaving || !fileSelected || !password">
                                  <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                                  {{ isSaving ? 'PROCESANDO...' : (isReplacing ? 'ACTUALIZAR FIRMA' : 'ACTIVAR FIRMA DIGITAL') }}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          </div>
      </div>

      <!-- DASHBOARD VIEW (HAS CONFIG) -->
      <div *ngIf="!loading && config && !isReplacing" class="dashboard-sri">
          <div class="row g-4">
              <!-- CERTIFICATE INFO CARD -->
              <div class="col-12 col-xl-8">
                  <div class="summary-card-lux h-100">
                      <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-light">
                          <h5 class="section-title m-0">Detalles del Certificado</h5>
                          <div class="d-flex align-items-center gap-2">
                              <button class="btn btn-mini-premium px-3" (click)="reemplazarCertificado()">
                                  <i class="bi bi-arrow-repeat me-1"></i> REEMPLAZAR
                              </button>
                              <div class="status-badge" [ngClass]="isExpired ? 'status-suspendida' : 'status-active'">
                                  <span class="pulse-dot"></span>
                                  {{ isExpired ? 'VENCIDO' : 'VIGENTE' }}
                              </div>
                          </div>
                      </div>

                      <div class="row g-4 mb-4">
                          <div class="col-md-12">
                              <label class="label-mono">TITULAR / RAZÓN SOCIAL</label>
                              <p class="value-premium text-uppercase mb-0">{{ config.cert_sujeto || 'DATOS NO DISPONIBLES' }}</p>
                          </div>
                      </div>

                      <div class="row g-4">
                          <div class="col-md-6">
                              <label class="label-mono">ENTIDAD CERTIFICADORA</label>
                              <p class="value-premium small mb-0">{{ config.cert_emisor || 'N/A' }}</p>
                          </div>
                          <div class="col-md-6">
                              <label class="label-mono">NÚMERO DE SERIAL</label>
                              <p class="value-premium small mb-0 text-truncate" title="{{ config.cert_serial }}">{{ config.cert_serial || 'N/A' }}</p>
                          </div>
                      </div>

                      <div class="info-footer-sri mt-5 p-3 bg-light-soft rounded-4">
                          <div class="row text-center">
                              <div class="col-6 border-end border-light">
                                  <label class="label-mono d-block">EMISIÓN</label>
                                  <span class="fw-800">{{ config.fecha_activacion_cert ? (config.fecha_activacion_cert | date:'dd MMM, yyyy') : 'N/A' }}</span>
                              </div>
                              <div class="col-6">
                                  <label class="label-mono d-block">EXPIRACIÓN</label>
                                  <span class="fw-800" [class.text-danger]="isExpired">{{ config.fecha_expiracion_cert | date:'dd MMM, yyyy' }}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- SRI PARAMETERS CARD -->
              <div class="col-12 col-xl-4">
                  <div class="summary-card-lux secondary-soft h-100">
                      <div class="d-flex justify-content-between align-items-center mb-4">
                          <h5 class="section-title m-0">Estatus del SRI</h5>
                          <button *ngIf="!isEditing" class="btn-icon-minimal" (click)="isEditing = true">
                              <i class="bi bi-pencil-square"></i>
                          </button>
                      </div>

                      <div *ngIf="!isEditing" class="animate__animated animate__fadeIn">
                          <div class="status-row-premium mb-3">
                              <div class="icon-circle-mini bg-white shadow-sm">
                                  <i class="bi bi-hdd-network"></i>
                              </div>
                              <div class="status-info">
                                  <span class="label">AMBIENTE ACTUAL</span>
                                  <span class="value-badge" [ngClass]="config.ambiente === 'PRODUCCION' ? 'bg-success' : 'bg-warning'">
                                      {{ config.ambiente }}
                                  </span>
                              </div>
                          </div>
                          <div class="status-row-premium">
                              <div class="icon-circle-mini bg-white shadow-sm">
                                  <i class="bi bi-broadcast"></i>
                              </div>
                              <div class="status-info">
                                  <span class="label">MODO DE EMISIÓN</span>
                                  <span class="value-badge bg-dark">
                                      {{ config.tipo_emision }}
                                  </span>
                              </div>
                          </div>
                      </div>

                      <div *ngIf="isEditing" class="animate__animated animate__fadeIn">
                          <form (ngSubmit)="onUpdateParams()">
                              <div class="mb-3">
                                  <label class="label-premium-mini">AMBIENTE</label>
                                  <select class="select-premium-mini" [(ngModel)]="updateParams.ambiente" name="upd_ambiente">
                                      <option value="PRUEBAS">PRUEBAS</option>
                                      <option value="PRODUCCION">PRODUCCION</option>
                                  </select>
                              </div>
                              <div class="mb-4">
                                  <label class="label-premium-mini">TIPO EMISIÓN</label>
                                  <select class="select-premium-mini" [(ngModel)]="updateParams.tipo_emision" name="upd_emision">
                                      <option value="NORMAL">NORMAL</option>
                                      <option value="CONTINGENCIA">CONTINGENCIA</option>
                                  </select>
                              </div>
                              <div class="d-flex gap-2">
                                  <button type="button" class="btn btn-light-premium w-50 py-2 fw-bold" (click)="isEditing = false" [disabled]="isUpdating">
                                      CANCELAR
                                  </button>
                                  <button type="submit" class="btn-premium-dark w-50 py-2 fw-bold" [disabled]="isUpdating || !hasChanges">
                                      {{ isUpdating ? 'GUARDANDO...' : 'GUARDAR' }}
                                  </button>
                              </div>
                          </form>
                      </div>

                      <div class="mt-auto pt-4 border-top border-light mt-4 d-flex align-items-center gap-2">
                          <i class="bi bi-info-circle-fill text-dark"></i>
                          <p class="m-0 x-small text-muted fw-bold">La configuración afecta a todos los puntos de emisión vinculados.</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- MODALS -->
      <div class="modal-premium-overlay" *ngIf="showReplaceModal">
          <div class="modal-premium-content p-5 text-center">
              <div class="warning-icon mb-4">
                  <i class="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h4 class="fw-900 mb-3">¿Reemplazar Firma?</h4>
              <p class="text-muted mb-4">Si confirma, deberá subir un nuevo archivo de firma digital. La configuración actual se mantendrá hasta que la nueva sea validada.</p>
              <div class="d-flex gap-3 justify-content-center">
                  <button class="btn btn-light-premium px-4 py-2 fw-bold" (click)="showReplaceModal = false">CANCELAR</button>
                  <button class="btn btn-danger px-4 py-2 fw-bold" style="border-radius: 12px;" (click)="confirmReplace()">SÍ, REEMPLAZAR</button>
              </div>
          </div>
      </div>

      <div class="modal-premium-overlay" *ngIf="showCancelReplaceModal">
          <div class="modal-premium-content p-4 text-center" style="max-width: 380px;">
              <h5 class="fw-900 mb-3">¿Cancelar cambios?</h5>
              <p class="text-muted small mb-4">Se perderá el archivo seleccionado y volverá a la vista de dashboard.</p>
              <div class="d-flex gap-2 justify-content-center">
                  <button class="btn btn-light-premium w-50 py-2 fw-bold" (click)="showCancelReplaceModal = false">NO</button>
                  <button class="btn btn-dark w-50 py-2 fw-bold" style="border-radius: 10px;" (click)="confirmCancelReplace()">SÍ, CANCELAR</button>
              </div>
          </div>
      </div>

      <div class="modal-premium-overlay" *ngIf="showSaveReplaceModal">
          <div class="modal-premium-content p-5 text-center">
              <div class="success-icon mb-4">
                  <i class="bi bi-shield-check"></i>
              </div>
              <h4 class="fw-900 mb-3">Confirmar Activación</h4>
              <p class="text-muted mb-4">Esta acción sobreescribirá los datos del SRI de forma permanente. ¿Desea continuar?</p>
              <div class="d-flex gap-3 justify-content-center">
                  <button class="btn btn-light-premium px-4 py-2 fw-bold" [disabled]="isSaving" (click)="showSaveReplaceModal = false">CANCELAR</button>
                  <button class="btn btn-primary px-4 py-2 fw-bold" style="border-radius: 12px;" [disabled]="isSaving" (click)="confirmSaveReplace()">
                      <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                      ACTIVAR YA
                  </button>
              </div>
          </div>
      </div>

    </div>
  `,
  styles: [`
    .config-sri-wrapper { width: 100%; padding: 4px; }
    
    .fw-900 { font-weight: 900; }
    .fw-800 { font-weight: 800; }
    .fs-7 { font-size: 0.75rem; }
    .x-small { font-size: 0.7rem; }

    /* Cards */
    .summary-card-lux {
      background: white; border-radius: 24px; padding: 2rem;
      border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.02);
      display: flex; flex-direction: column;
    }
    .secondary-soft { background: #f1f5f9; border: none; }
    .bg-light-soft { background: #fcfcfd; }

    .section-title {
      font-size: 0.9rem; font-weight: 900; color: black;
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    /* Labels & Inputs */
    .label-premium {
      font-size: 0.65rem; font-weight: 800; color: #94a3b8;
      letter-spacing: 1px; margin-bottom: 0.5rem; display: block;
    }
    .label-premium-mini { font-size: 0.6rem; font-weight: 900; color: #64748b; margin-bottom: 0.4rem; display: block; }
    .label-mono { font-size: 0.6rem; font-weight: 800; color: #94a3b8; letter-spacing: 1px; margin-bottom: 0.3rem; display: block; }

    .input-premium-wrapper {
      position: relative; display: flex; align-items: center;
      background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;
      padding: 0 1rem; transition: all 0.2s;
    }
    .input-premium-wrapper:focus-within { border-color: black; background: white; box-shadow: 0 0 0 3px rgba(22, 29, 53, 0.05); }
    .input-premium-wrapper i { color: #94a3b8; }
    .input-premium {
      width: 100%; border: none; background: transparent; padding: 0.75rem 1rem;
      font-size: 0.9rem; font-weight: 700; outline: none;
    }

    .select-premium {
      width: 100%; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0;
      background: #f8fafc; font-size: 0.9rem; font-weight: 700; cursor: pointer;
    }
    .select-premium-mini {
      width: 100%; padding: 0.5rem 0.75rem; border-radius: 10px; border: 1px solid #e2e8f0;
      background: white; font-size: 0.8rem; font-weight: 700; cursor: pointer;
    }

    /* Buttons */
    .btn-premium-dark {
      background: var(--primary-color); color: white; border: none; border-radius: 12px;
      font-weight: 800; font-size: 0.85rem; letter-spacing: 0.5px; transition: all 0.2s;
    }
    .btn-premium-dark:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(22, 29, 53, 0.2); }
    .btn-premium-dark:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-light-premium {
      background: #f1f5f9; color: #64748b; border: none; border-radius: 12px;
      font-weight: 800; font-size: 0.85rem; transition: all 0.2s;
    }
    .btn-mini-premium {
      background: var(--primary-color); color: white; border: none; border-radius: 8px;
      font-weight: 800; font-size: 0.7rem; letter-spacing: 0.5px;
    }

    .btn-icon-minimal {
      background: transparent; border: none; color: #94a3b8; font-size: 1.1rem;
      transition: color 0.2s; cursor: pointer;
    }
    .btn-icon-minimal:hover { color: black; }

    /* Icons */
    .icon-circle-large {
      width: 72px; height: 72px; border-radius: 50%; background: var(--primary-color);
      color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem;
    }
    .icon-circle-mini {
      width: 40px; height: 40px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
    }

    /* Upload Area */
    .upload-area {
      border: 2px dashed #cbd5e1; border-radius: 20px; padding: 3rem 2rem;
      text-align: center; cursor: pointer; transition: all 0.2s; background: white;
    }
    .upload-area:hover, .upload-area.is-dragging { border-color: black; background: #fcfcfd; }
    .upload-area i { font-size: 2.5rem; color: #cbd5e1; }

    /* Statuses */
    .status-badge {
      display: flex; align-items: center; gap: 6px; padding: 4px 12px;
      border-radius: 10px; font-size: 0.7rem; font-weight: 800;
    }
    .status-active { background: #ecfdf5; color: #10b981; }
    .status-suspendida { background: #fef2f2; color: #ef4444; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    
    .value-premium { font-size: 1.1rem; font-weight: 900; color: black; line-height: 1.2; }
    .text-dark { color: #2563eb !important; }

    .status-row-premium { display: flex; align-items: center; gap: 1rem; }
    .status-info { display: flex; flex-direction: column; }
    .status-info .label { font-size: 0.65rem; color: #94a3b8; font-weight: 800; margin-bottom: 2px; }
    .value-badge {
       padding: 3px 10px; border-radius: 8px; font-size: 0.75rem; 
       font-weight: 900; color: white; display: inline-block; width: fit-content;
    }

    /* Modals */
    .modal-premium-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
      z-index: 9999; display: flex; align-items: center; justify-content: center;
    }
    .modal-premium-content {
      background: white; border-radius: 28px; width: 100%; max-width: 450px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
    }
    .warning-icon { width: 72px; height: 72px; color: #f59e0b; font-size: 3rem; margin: 0 auto; }
    .success-icon { width: 72px; height: 72px; color: #10b981; font-size: 3rem; margin: 0 auto; }

    .spinner-premium {
      width: 40px; height: 40px; border: 3px solid #f1f5f9; border-top-color: black;
      border-radius: 50%; animation: spin 1s linear infinite;
    }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class ConfigSriComponent implements OnInit {
  private sriService = inject(SriConfigService);
  private uiService = inject(UiService);
  private cd = inject(ChangeDetectorRef);

  config: ConfigSRI | null = null;
  loading = true;
  isSaving = false;
  isUpdating = false;
  isEditing = false;
  isDragging = false;
  showPassword = false;

  // Replacement Flow
  isReplacing = false;
  showReplaceModal = false;
  showCancelReplaceModal = false;
  showSaveReplaceModal = false;

  password = '';
  selectedFile: File | null = null;
  fileSelected = false;
  selectedFileName = '';
  setupParams: ActualizarParametrosSRI = { ambiente: 'PRUEBAS', tipo_emision: 'NORMAL' };
  updateParams: ActualizarParametrosSRI = { ambiente: 'PRUEBAS', tipo_emision: 'NORMAL' };

  ngOnInit(): void {
    this.cargarConfiguracion();
  }

  get isExpired(): boolean {
    if (!this.config) return false;
    return new Date(this.config.fecha_expiracion_cert) < new Date();
  }

  get hasChanges(): boolean {
    if (!this.config) return false;
    return this.config.ambiente !== this.updateParams.ambiente || 
           this.config.tipo_emision !== this.updateParams.tipo_emision;
  }

  cargarConfiguracion(): void {
    this.loading = true;
    this.sriService.obtenerConfiguracion().pipe(
      finalize(() => {
        this.loading = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        this.config = data;
        if (data) {
          this.updateParams = { ambiente: data.ambiente, tipo_emision: data.tipo_emision };
        }
      },
      error: (err) => {
        this.uiService.showError(err, 'No se pudo cargar la configuración SRI');
      }
    });
  }

  // File Handlers
  onDragOver(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragging = true; }
  onDragLeave(e: DragEvent): void { e.preventDefault(); e.stopPropagation(); this.isDragging = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault(); e.stopPropagation(); this.isDragging = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) this.handleFileSelect(files[0]);
  }
  onFileChange(e: any): void {
    const file = e.target.files[0];
    if (file) this.handleFileSelect(file);
  }
  private handleFileSelect(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'p12' || ext === 'pfx') {
      this.selectedFile = file;
      this.fileSelected = true;
      this.selectedFileName = file.name;
    } else {
      this.uiService.showToast('Formato inválido. Use .p12 o .pfx', 'danger');
    }
  }

  triggerUpload(): void {
    if (!this.selectedFile || !this.password) return;
    if (this.isReplacing) {
      this.showSaveReplaceModal = true;
    } else {
      this.onUpload();
    }
  }

  onUpload(): void {
    if (!this.selectedFile || !this.password) return;
    this.isSaving = true;
    this.sriService.subirCertificado(this.selectedFile, this.password, this.setupParams.ambiente, this.setupParams.tipo_emision)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cd.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.config = data;
          this.uiService.showToast('Certificado activado correctamente', 'success');
          this.resetInputs();
          this.isReplacing = false;
        },
        error: (err) => this.uiService.showError(err, 'Error al validar firma o contraseña')
      });
  }

  onUpdateParams(): void {
    this.isUpdating = true;
    this.sriService.actualizarParametros(this.updateParams).pipe(
      finalize(() => {
        this.isUpdating = false;
        this.isEditing = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (data) => {
        this.config = data;
        this.uiService.showToast('Parámetros SRI actualizados', 'success');
      },
      error: (err) => this.uiService.showError(err, 'Fallo la actualización de parámetros')
    });
  }

  reemplazarCertificado(): void { this.showReplaceModal = true; }
  confirmReplace(): void { this.isReplacing = true; this.showReplaceModal = false; this.resetInputs(); }
  cancelReplaceBtn(): void { this.showCancelReplaceModal = true; }
  confirmCancelReplace(): void { this.isReplacing = false; this.showCancelReplaceModal = false; this.resetInputs(); }
  confirmSaveReplace(): void { this.showSaveReplaceModal = false; this.onUpload(); }

  private resetInputs(): void {
    this.password = '';
    this.selectedFile = null;
    this.fileSelected = false;
    this.selectedFileName = '';
  }
}



