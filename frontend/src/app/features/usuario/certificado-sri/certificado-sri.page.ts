import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SriConfigService } from './services/sri-config.service';
import { ConfigSRI, ActualizarParametrosSRI } from './models/sri-config.model';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { UiService } from '../../../shared/services/ui.service';
import { finalize, Subscription, switchMap, of } from 'rxjs';
import { PermissionsService } from '../../../core/auth/permissions.service';
import { CONFIGURACION_PERMISSIONS } from '../../../constants/permission-codes';

@Component({
    selector: 'app-certificado-sri',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="sri-dashboard fade-in">
        <div class="container-fluid px-0">
            <ng-container *ngIf="canView; else noPermission">
                <!-- LOADING STATE -->
                <div *ngIf="loading" class="d-flex justify-content-center py-5">
                    <div class="custom-loader"></div>
                </div>

                <!-- SETUP VIEW (NO CONFIG) -->
                <div *ngIf="!loading && (!config || isReplacing)" class="setup-view">
                    <div class="row justify-content-center">
                        <div class="col-xl-5 col-lg-7">
                            <div class="mono-card shadow-premium">
                                <div class="p-5">
                                    <div class="text-center mb-5">
                                        <div class="icon-circle mb-4">
                                            <i class="bi bi-shield-lock"></i>
                                        </div>
                                        <h2 class="h4 fw-bold mb-2">Vincular Firma Digital</h2>
                                        <p class="text-muted small">Configure su certificado .p12 para emitir comprobantes.</p>
                                    </div>

                                    <form (ngSubmit)="triggerUpload()" #uploadForm="ngForm">
                                        <div class="upload-area mb-4" 
                                             [class.is-dragging]="isDragging"
                                             [class.has-file]="fileSelected"
                                             (dragover)="onDragOver($event)"
                                             (dragleave)="onDragLeave($event)"
                                             (drop)="onDrop($event)"
                                             (click)="fileInput.click()">
                                            <i class="bi mb-3" [class]="fileSelected ? 'bi-check2-circle' : 'bi-upload'"></i>
                                            <h4 class="h6 fw-bold mb-1">{{ fileSelected ? selectedFileName : 'Arrastre o seleccione' }}</h4>
                                            <p class="x-small text-muted mb-0">Formatos .p12 o .pfx</p>
                                            <input #fileInput type="file" (change)="onFileChange($event)" accept=".p12,.pfx" hidden>
                                        </div>

                                        <div class="form-group-mono mb-4">
                                            <label class="label-mono">CONTRASEÑA</label>
                                            <div class="input-mono-wrapper">
                                                <i class="bi bi-key"></i>
                                                <input [type]="showPassword ? 'text' : 'password'" 
                                                       class="input-mono" [(ngModel)]="password" name="password" 
                                                       placeholder="Clave de exportación" required>
                                                <button type="button" class="btn-toggle-eye" (click)="showPassword = !showPassword">
                                                    <i class="bi" [class]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="row g-3 mb-5">
                                            <div class="col-6">
                                                <label class="label-mono">AMBIENTE</label>
                                                <select class="input-mono" [(ngModel)]="setupParams.ambiente" name="ambiente" required>
                                                    <option value="PRUEBAS">PRUEBAS</option>
                                                    <option value="PRODUCCION">PRODUCCION</option>
                                                </select>
                                            </div>
                                            <div class="col-6">
                                                <label class="label-mono">EMISION</label>
                                                <select class="input-mono" [(ngModel)]="setupParams.tipo_emision" name="tipo_emision" required>
                                                    <option value="NORMAL">NORMAL</option>
                                                    <option value="CONTINGENCIA">CONTINGENCIA</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="d-flex gap-3">
                                            <button *ngIf="isReplacing" type="button" class="btn btn-light py-3 fw-bold" style="border-radius: 12px; width: 40%;" [disabled]="isSaving" (click)="cancelReplaceBtn()">
                                                CANCELAR
                                            </button>
                                            <button type="submit" class="btn-mono-primary py-3" [style.width]="isReplacing ? '60%' : '100%'"
                                                    [disabled]="isSaving || !fileSelected || !password">
                                                <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                                                {{ isSaving ? 'ACTIVANDO...' : 'ACTIVAR FIRMA' }}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- DASHBOARD VIEW (HAS CONFIG) -->
                <div *ngIf="!loading && config && !isReplacing" class="dashboard-view-premium">

                    <div class="row g-4">
                        <!-- TARJETA PRINCIPAL DEL CERTIFICADO -->
                        <div class="col-xl-8 col-lg-7">
                            <div class="card-premium h-100">
                               <div class="card-header-glass d-flex justify-content-between align-items-center">
                                  <h5 class="mb-0 fw-bold d-flex align-items-center gap-2" style="font-size: 0.95rem; color: #1e293b;">
                                     <i class="bi bi-file-earmark-lock-fill text-primary"></i> 
                                     Detalles del Certificado
                                  </h5>
                                  <div class="d-flex align-items-center gap-3">
                                      <button class="btn btn-sm btn-outline-dark d-flex align-items-center gap-2 fw-bold px-3" style="border-radius: 10px; font-size: 0.75rem;" (click)="reemplazarCertificado()">
                                          <i class="bi bi-cloud-arrow-up-fill"></i> REEMPLAZAR
                                      </button>
                                      <div class="status-badge" [ngClass]="isExpired ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'">
                                          <div class="status-dot"></div>
                                          {{ isExpired ? 'VENCIDO' : 'VIGENTE' }}
                                      </div>
                                  </div>
                               </div>
                               
                               <div class="card-body p-4 p-md-5">
                                   <div class="row g-4">
                                       <div class="col-md-6">
                                           <div class="info-block">
                                              <span class="info-label">TITULAR Y RAZÓN SOCIAL</span>
                                              <p class="info-value text-uppercase fw-bold text-dark">{{ config.cert_sujeto || 'Desconocido' }}</p>
                                           </div>
                                       </div>
                                       <div class="col-md-6">
                                           <div class="info-block">
                                              <span class="info-label">ENTIDAD CERTIFICADORA (EMISOR)</span>
                                              <p class="info-value text-secondary">{{ config.cert_emisor || 'Desconocido' }}</p>
                                           </div>
                                       </div>
                                   </div>

                                   <hr class="my-4 border-light opacity-50">

                                   <!-- FECHAS Y SERIAL -->
                                   <div class="row g-4">
                                       <div class="col-sm-4">
                                           <div class="info-block text-center text-sm-start">
                                              <div class="icon-wrapper mb-2 text-primary bg-primary-soft mx-auto mx-sm-0">
                                                 <i class="bi bi-calendar-check"></i>
                                              </div>
                                              <span class="info-label">FECHA DE ACTIVACIÓN</span>
                                              <p class="info-value fw-medium">{{ config.fecha_activacion_cert ? (config.fecha_activacion_cert | date:'dd MMM yyyy') : 'N/A' }}</p>
                                           </div>
                                       </div>
                                       <div class="col-sm-4">
                                           <div class="info-block text-center text-sm-start">
                                              <div class="icon-wrapper mb-2 flex mx-auto mx-sm-0" [ngClass]="isExpired ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning'">
                                                 <i class="bi bi-clock-history"></i>
                                              </div>
                                              <span class="info-label">FECHA DE VENCIMIENTO</span>
                                              <p class="info-value fw-bold" [ngClass]="{'text-danger': isExpired}">
                                                  {{ config.fecha_expiracion_cert | date:'dd MMM yyyy' }}
                                                  <small *ngIf="isExpired" class="d-block mt-1 badge bg-danger text-white rounded-pill px-2">Requiere renovación</small>
                                              </p>
                                           </div>
                                       </div>
                                       <div class="col-sm-4">
                                           <div class="info-block text-center text-sm-start">
                                              <div class="icon-wrapper mb-2 text-dark bg-light mx-auto mx-sm-0">
                                                 <i class="bi bi-hash"></i>
                                              </div>
                                              <span class="info-label">SERIAL INTERNO</span>
                                              <p class="info-value small text-truncate text-secondary" title="{{ config.cert_serial }}">
                                                {{ config.cert_serial || 'No disponible' }}
                                              </p>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                            </div>
                        </div>

                        <!-- TARJETA DE EDICIÓN SRI -->
                        <div class="col-xl-4 col-lg-5">
                            <div class="card-premium h-100 sri-params-card">
                               <div class="card-header-glass d-flex justify-content-between align-items-center">
                                  <h5 class="mb-0 fw-bold d-flex align-items-center gap-2" style="font-size: 0.95rem; color: #1e293b;">
                                     <i class="bi bi-sliders text-dark"></i> 
                                     Parámetros SRI
                                  </h5>
                                  <button *ngIf="!isEditing" class="btn-action-light" (click)="isEditing = true" title="Editar">
                                      <i class="bi bi-pencil-square"></i>
                                  </button>
                               </div>

                               <div class="card-body p-4 d-flex flex-column h-100">
                                   
                                   <!-- MODO LECTURA -->
                                   <div *ngIf="!isEditing" class="read-mode fade-in d-flex flex-column">
                                      <div class="param-row mb-4 p-3 bg-light rounded-4 d-flex justify-content-between align-items-center border border-white shadow-sm">
                                          <div class="d-flex align-items-center gap-3">
                                              <div class="param-icon bg-white text-dark shadow-sm">
                                                  <i class="bi bi-hdd-network"></i>
                                              </div>
                                              <div>
                                                  <span class="info-label d-block mb-1">AMBIENTE</span>
                                                  <span class="badge rounded-pill fw-bold fs-7 px-3 py-2 border" 
                                                        [ngClass]="config.ambiente === 'PRODUCCION' ? 'bg-success text-white border-success' : 'bg-warning-soft text-warning border-warning border-opacity-50'">
                                                      {{ config.ambiente }}
                                                  </span>
                                              </div>
                                          </div>
                                      </div>

                                      <div class="param-row p-3 bg-light rounded-4 d-flex justify-content-between align-items-center border border-white shadow-sm">
                                          <div class="d-flex align-items-center gap-3">
                                              <div class="param-icon bg-white text-dark shadow-sm">
                                                  <i class="bi bi-broadcast"></i>
                                              </div>
                                              <div>
                                                  <span class="info-label d-block mb-1">TIPO EMISIÓN</span>
                                                  <span class="badge bg-dark rounded-pill fw-bold fs-7 px-3 py-2 border border-dark">
                                                      {{ config.tipo_emision }}
                                                  </span>
                                              </div>
                                          </div>
                                      </div>
                                   </div>

                                   <!-- MODO EDICIÓN -->
                                   <div *ngIf="isEditing" class="edit-mode fade-in">
                                      <form (ngSubmit)="onUpdateParams()" class="d-flex flex-column">
                                          <div class="mb-3">
                                              <label class="form-label text-uppercase text-secondary fw-bold" style="font-size: 0.7rem; letter-spacing: 0.5px;">Seleccionar Ambiente</label>
                                              <div class="modern-select-wrapper">
                                                  <i class="bi bi-hdd-network dropdown-icon"></i>
                                                  <select class="form-select form-select-lg modern-select" [(ngModel)]="updateParams.ambiente" name="upd_ambiente">
                                                      <option value="PRUEBAS">PRUEBAS</option>
                                                      <option value="PRODUCCION">PRODUCCION</option>
                                                  </select>
                                              </div>
                                          </div>
                                          <div class="mb-3">
                                              <label class="form-label text-uppercase text-secondary fw-bold" style="font-size: 0.7rem; letter-spacing: 0.5px;">Tipo de Emisión</label>
                                              <div class="modern-select-wrapper">
                                                  <i class="bi bi-broadcast dropdown-icon"></i>
                                                  <select class="form-select form-select-lg modern-select" [(ngModel)]="updateParams.tipo_emision" name="upd_emision">
                                                      <option value="NORMAL">NORMAL</option>
                                                      <option value="CONTINGENCIA">CONTINGENCIA</option>
                                                  </select>
                                              </div>
                                          </div>
                                          
                                          <div class="d-flex gap-2 mt-4">
                                              <button type="button" class="btn btn-light w-50 fw-bold rounded-3 py-2" (click)="isEditing = false" [disabled]="isUpdating">
                                                  Cancelar
                                              </button>
                                              <button type="submit" class="btn btn-dark w-50 fw-bold rounded-3 py-2 d-flex align-items-center justify-content-center gap-2" [disabled]="isUpdating || !hasChanges">
                                                  <span *ngIf="isUpdating" class="spinner-border spinner-border-sm"></span>
                                                  {{ isUpdating ? 'Guardando...' : 'Guardar' }}
                                              </button>
                                          </div>
                                      </form>
                                   </div>
                               </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- MODAL REEMPLAZAR -->
                <div class="modal-overlay" *ngIf="showReplaceModal">
                    <div class="modal-content bg-white border-0 shadow-premium p-4 p-md-5 text-center mx-3" style="border-radius: 20px; max-width: 420px; width: 100%;">
                        <i class="bi bi-exclamation-triangle-fill text-warning mb-3" style="font-size: 3rem;"></i>
                        <h4 class="fw-bold mb-3">Reemplazar Certificado</h4>
                        <p class="text-secondary mb-4" style="font-size: 0.95rem;">
                            ¿Estás seguro de que deseas reemplazar la firma digital?<br><br>
                            <strong class="text-dark">Nota:</strong> Tus datos actuales se mantendrán intactos hasta que actives la nueva firma.
                        </p>
                        <div class="d-flex gap-3 justify-content-center">
                            <button type="button" class="btn btn-light fw-bold" style="border-radius: 12px; width: 130px;" (click)="showReplaceModal = false">Cancelar</button>
                            <button type="button" class="btn btn-warning fw-bold" style="border-radius: 12px; width: 130px;" (click)="confirmReplace()">Reemplazar</button>
                        </div>
                    </div>
                </div>

                <!-- MODAL CANCELAR REEMPLAZO -->
                <div class="modal-overlay" *ngIf="showCancelReplaceModal">
                    <div class="modal-content bg-white border-0 shadow-premium p-4 text-center mx-3" style="border-radius: 20px; max-width: 360px; width: 100%;">
                        <i class="bi bi-x-circle text-secondary mb-3" style="font-size: 2.5rem;"></i>
                        <h5 class="fw-bold mb-3">¿Cancelar reemplazo?</h5>
                        <p class="text-secondary mb-4 small">
                            Perderás el archivo que hayas seleccionado y volverás a la vista anterior.
                        </p>
                        <div class="d-flex gap-2 justify-content-center">
                            <button type="button" class="btn btn-light w-50 fw-bold" style="border-radius: 10px;" (click)="showCancelReplaceModal = false">No</button>
                            <button type="button" class="btn btn-dark w-50 fw-bold" style="border-radius: 10px;" (click)="confirmCancelReplace()">Sí, Cancelar</button>
                        </div>
                    </div>
                </div>

                <!-- MODAL GUARDAR NUEVO CERTIFICADO -->
                <div class="modal-overlay" *ngIf="showSaveReplaceModal">
                    <div class="modal-content bg-white border-0 shadow-premium p-4 p-md-5 text-center mx-3" style="border-radius: 20px; max-width: 420px; width: 100%;">
                        <i class="bi bi-shield-check text-primary mb-3" style="font-size: 3rem;"></i>
                        <h4 class="fw-bold mb-3">Confirmar Activación</h4>
                        <p class="text-secondary mb-4" style="font-size: 0.95rem;">
                            Estás a punto de activar tu nueva firma.<br>Esto sobreescribirá los datos del SRI de forma permanente.
                        </p>
                        <div class="d-flex gap-3 justify-content-center">
                            <button type="button" class="btn btn-light fw-bold" style="border-radius: 12px; width: 130px;" [disabled]="isSaving" (click)="showSaveReplaceModal = false">Cancelar</button>
                            <button type="button" class="btn btn-primary fw-bold" style="border-radius: 12px; width: 130px;" [disabled]="isSaving" (click)="confirmSaveReplace()">
                                <span *ngIf="isSaving" class="spinner-border spinner-border-sm"></span>
                                {{ isSaving ? '' : 'Guardar' }}
                            </button>
                        </div>
                    </div>
                </div>
            </ng-container>

            <!-- TEMPLATE SIN PERMISO -->
            <ng-template #noPermission>
                <div class="no-permission-container d-flex flex-column align-items-center justify-content-center text-center p-5 animate-fade-in" style="min-height: 70vh;">
                    <div class="icon-lock-wrapper mb-4">
                        <i class="bi bi-shield-lock-fill"></i>
                    </div>
                    <h2 class="fw-bold text-dark mb-2">Acceso Restringido</h2>
                    <p class="text-muted mb-4 mx-auto" style="max-width: 400px;">
                        No tienes permisos suficientes para configurar el certificado SRI o los ambientes de esta empresa. 
                        Contacta a un administrador para obtener acceso.
                    </p>
                    <button class="btn btn-dark rounded-pill px-5 py-3 fw-bold shadow-sm" (click)="cargarConfiguracion()">
                        <i class="bi bi-arrow-clockwise me-2"></i> Reintentar sincronización
                    </button>
                </div>
            </ng-template>
        </div>
    </div>
  `,
    styles: [`
        .modal-overlay {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
            z-index: 9999; display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        .sri-dashboard { padding: 2rem; color: #1a1a1a; }
        
        .mono-card {
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            overflow: hidden;
        }

        .shadow-premium {
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
        }

        .icon-circle {
            width: 64px; height: 64px; border-radius: 50%; background: #000;
            color: #fff; display: flex; align-items: center; justify-content: center;
            margin: 0 auto; font-size: 1.5rem;
        }

        .icon-square-small {
            width: 32px; height: 32px; border-radius: 6px; background: #f5f5f5;
            display: flex; align-items: center; justify-content: center; font-size: 1rem;
        }

        .upload-area {
            border: 2px dashed #e5e5e5; border-radius: 12px; padding: 2.5rem;
            text-align: center; cursor: pointer; transition: all 0.2s;
            background: #fafafa;
        }

        .upload-area:hover, .upload-area.is-dragging { 
            border-color: #000; background: #fff;
        }

        .upload-area.has-file { border-color: #000; background: #f8f8f8; border-style: solid; }
        .upload-area i { font-size: 2rem; color: #888; }
        .upload-area.has-file i { color: #000; }

        .label-mono {
            font-size: 0.65rem; font-weight: 800; color: #999;
            letter-spacing: 1.5px; margin-bottom: 0.5rem; display: block;
        }

        .input-mono-wrapper {
            position: relative; display: flex; align-items: center;
            border-bottom: 1px solid #e5e5e5;
        }

        .input-mono-wrapper i { color: #ccc; margin-right: 10px; }

        .input-mono {
            width: 100%; border: none; border-bottom: 1px solid #e5e5e5;
            padding: 0.75rem 0; font-weight: 600; font-size: 0.9rem;
            background: transparent; outline: none; transition: border 0.3s;
        }

        select.input-mono { cursor: pointer; appearance: none; }

        .input-mono:focus { border-color: #000; }

        .btn-toggle-eye {
            border: none; background: transparent; color: #ccc; padding: 5px; cursor: pointer;
        }

        .btn-mono-primary {
            background: #000; color: #fff; border: none; padding: 1rem;
            border-radius: 8px; font-weight: 700; font-size: 0.8rem;
            letter-spacing: 1px; transition: opacity 0.2s;
        }

        .btn-mono-primary:hover:not(:disabled) { opacity: 0.8; }
        .btn-mono-primary:disabled { opacity: 0.3; cursor: not-allowed; }

        .card-premium {
            background: #ffffff;
            border-radius: 24px;
            border: 1px solid rgba(226, 232, 240, 0.8);
            box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.04), 0 4px 10px -5px rgba(15, 23, 42, 0.02);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .card-premium:hover {
            box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.08), 0 10px 20px -10px rgba(15, 23, 42, 0.04);
            transform: translateY(-2px);
        }

        .card-header-glass {
            background: rgba(248, 250, 252, 0.8);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(226, 232, 240, 0.8);
            padding: 1.25rem 1.5rem;
        }

        .icon-circle-mini {
            width: 32px; height: 32px;
            border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
        }

        .info-block {
            display: flex; flex-direction: column; gap: 0.25rem;
        }

        .info-label {
            font-size: 0.65rem; font-weight: 800; color: #94a3b8;
            letter-spacing: 1px; text-transform: uppercase;
        }

        .info-value {
            font-size: 0.95rem; margin-bottom: 0; word-break: break-word; line-height: 1.4;
        }

        .icon-wrapper {
            width: 40px; height: 40px;
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.1rem;
        }

        .status-badge {
            display: inline-flex; align-items: center; gap: 0.35rem;
            padding: 0.35rem 0.75rem; border-radius: 50rem;
            font-size: 0.65rem; font-weight: 800; letter-spacing: 0.5px;
        }

        .status-dot {
            width: 6px; height: 6px; border-radius: 50%; background-color: currentColor;
        }

        .bg-success-soft { background: #ecfdf5; }
        .bg-danger-soft { background: #fef2f2; }
        .bg-warning-soft { background: #fffbeb; }
        .bg-primary-soft { background: #eff6ff; }

        .btn-action-light {
            background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;
            width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
            color: #64748b; transition: all 0.2s; cursor: pointer;
        }

        .btn-action-light:hover {
            background: #f8fafc; color: #0f172a; border-color: #cbd5e1;
        }

        .param-icon {
            width: 36px; height: 36px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center; font-size: 1rem;
        }
        
        .fs-7 { font-size: 0.75rem; }

        /* Modern Select inside edit mode */
        .modern-select-wrapper { position: relative; }
        .modern-select {
            padding-left: 2.5rem; border-radius: 12px; border: 1px solid #e2e8f0;
            background-color: #f8fafc; font-size: 0.85rem; font-weight: 600;
            color: #0f172a; box-shadow: none; transition: all 0.2s;
        }
        .modern-select:focus { 
            background-color: #ffffff; border-color: #0f172a; outline: none; box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.05);
        }
        .dropdown-icon {
            position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
            color: #64748b; font-size: 1.1rem; pointer-events: none;
        }

        .border-start-mono { border-left: 1px solid #f0f0f0; padding-left: 2rem; }

        .mono-badge {
            display: inline-block; padding: 0.5rem 1rem; background: #f0f0f0;
            border-radius: 6px; font-weight: 800; font-size: 0.7rem; color: #666;
        }

        .badge-active { background: #000; color: #fff; }

        .custom-loader {
            width: 40px; height: 40px; border: 3px solid #f3f3f3;
            border-top: 3px solid #000; border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out; }

        .icon-lock-wrapper {
            width: 80px; height: 80px; background: #fee2e2; color: #ef4444; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; font-size: 2.5rem;
            box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.2);
        }
    `]
})
export class CertificadoSriPage implements OnInit, OnDestroy {
    get canView(): boolean {
        return this.permissionsService.hasPermission(CONFIGURACION_PERMISSIONS.SRI);
    }

    config: ConfigSRI | null = null;
    loading = true;
    isSaving = false;
    isUpdating = false;
    isEditing = false;
    isDragging = false;
    showPassword = false;

    // Modals & Replace logic
    isReplacing = false;
    showReplaceModal = false;
    showCancelReplaceModal = false;
    showSaveReplaceModal = false;

    // Setup State
    password = '';
    selectedFile: File | null = null;
    fileSelected = false;
    selectedFileName = '';
    setupParams: ActualizarParametrosSRI = {
        ambiente: 'PRUEBAS',
        tipo_emision: 'NORMAL'
    };

    // Update State
    updateParams: ActualizarParametrosSRI = {
        ambiente: 'PRUEBAS',
        tipo_emision: 'NORMAL'
    };

    private userSub?: Subscription;

    private permissionsService = inject(PermissionsService);

    constructor(
        private sriService: SriConfigService,
        private authFacade: AuthFacade,
        private uiService: UiService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        console.log('[CertificadoSRI] Componente inicializado');
        this.cargarConfiguracion();
    }

    ngOnDestroy() {
        this.userSub?.unsubscribe();
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

    cargarConfiguracion() {
        this.loading = true;
        console.log('[CertificadoSRI] -> Cargando configuración...');

        this.sriService.obtenerConfiguracion()
            .subscribe({
                next: (data) => {
                    console.log('[CertificadoSRI] -> Datos recibidos correctamente:', data);
                    this.config = data;
                    if (data) {
                        this.updateParams = {
                            ambiente: data.ambiente,
                            tipo_emision: data.tipo_emision
                        };
                    }
                    // Forzar fin de carga
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('[CertificadoSRI] -> Error en petición:', err);
                    this.uiService.showError(err, 'No se pudo cargar la configuración');
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                complete: () => {
                    console.log('[CertificadoSRI] -> Petición completada');
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
    }

    // Drag & Drop Handlers
    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.handleFileSelect(files[0]);
        }
    }

    onFileChange(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.handleFileSelect(file);
        }
    }

    private handleFileSelect(file: File) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'p12' || ext === 'pfx') {
            this.selectedFile = file;
            this.fileSelected = true;
            this.selectedFileName = file.name;
        } else {
            this.uiService.showToast('Formato inválido. Use .p12 o .pfx', 'danger');
        }
    }

    onUpload() {
        if (!this.selectedFile || !this.password) return;

        this.isSaving = true;
        this.sriService.subirCertificado(
            this.selectedFile,
            this.password,
            this.setupParams.ambiente,
            this.setupParams.tipo_emision
        ).pipe(finalize(() => this.isSaving = false))
            .subscribe({
                next: (data) => {
                    this.config = data;
                    this.uiService.showToast('Certificado activado y RUC sincronizado', 'success');
                    this.password = '';
                    this.selectedFile = null;
                    this.fileSelected = false;

                    // Redirigir a la página de empresa para ver el RUC actualizado
                    setTimeout(() => {
                        window.location.href = '/usuario/empresa';
                    }, 1500);
                },
                error: (err) => {
                    console.error('Upload Error:', err);
                    this.uiService.showError(err, 'Clave incorrecta o archivo inválido');
                }
            });
    }

    onUpdateParams() {
        this.isUpdating = true;
        this.sriService.actualizarParametros(this.updateParams)
            .pipe(finalize(() => {
                this.isUpdating = false;
                this.isEditing = false;
            }))
            .subscribe({
                next: (data) => {
                    this.config = data;
                    this.uiService.showToast('Actualizado', 'success');
                },
                error: (err) => this.uiService.showError(err, 'Fallo la actualización')
            });
    }

    reemplazarCertificado() {
        this.showReplaceModal = true;
    }

    confirmReplace() {
        this.isReplacing = true;
        this.showReplaceModal = false;
        this.fileSelected = false;
        this.selectedFileName = '';
        this.password = '';
    }

    cancelReplaceBtn() {
        this.showCancelReplaceModal = true;
    }

    confirmCancelReplace() {
        this.isReplacing = false;
        this.showCancelReplaceModal = false;
        this.fileSelected = false;
        this.selectedFileName = '';
        this.password = '';
    }

    triggerUpload() {
        if (!this.selectedFile || !this.password) return;
        if (this.isReplacing) {
            this.showSaveReplaceModal = true;
        } else {
            this.onUpload();
        }
    }

    confirmSaveReplace() {
        this.showSaveReplaceModal = false;
        this.onUpload();
    }
}
