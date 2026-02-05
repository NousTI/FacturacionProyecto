import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SriConfigService } from './services/sri-config.service';
import { ConfigSRI, ActualizarParametrosSRI } from './models/sri-config.model';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { UiService } from '../../../shared/services/ui.service';
import { finalize, Subscription, switchMap, of } from 'rxjs';

@Component({
    selector: 'app-certificado-sri',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="sri-dashboard fade-in">
        <div class="container-fluid px-0">
            <!-- LOADING STATE -->
            <div *ngIf="loading" class="d-flex justify-content-center py-5">
                <div class="custom-loader"></div>
            </div>

            <!-- SETUP VIEW (NO CONFIG) -->
            <div *ngIf="!loading && !config" class="setup-view">
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

                                <form (ngSubmit)="onUpload()" #uploadForm="ngForm">
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

                                    <button type="submit" class="btn-mono-primary w-100 py-3" 
                                            [disabled]="isSaving || !fileSelected || !password">
                                        <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                                        {{ isSaving ? 'ACTIVANDO...' : 'ACTIVAR FIRMA' }}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DASHBOARD VIEW (HAS CONFIG) -->
            <div *ngIf="!loading && config" class="dashboard-view">
                <div class="row g-4 justify-content-center">
                    <div class="col-lg-8">
                        <div class="mono-card shadow-premium">
                            <div class="p-4 border-bottom d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <div class="icon-square-small me-3">
                                        <i class="bi bi-check2-all"></i>
                                    </div>
                                    <h3 class="h6 fw-bold mb-0">ESTADO DE FACTURACIÓN</h3>
                                </div>
                                <div class="d-flex gap-2">
                                    <button *ngIf="!isEditing" class="btn-mono-outline btn-sm" (click)="isEditing = true">
                                        <i class="bi bi-pencil me-1"></i> EDITAR
                                    </button>
                                    <button *ngIf="isEditing" class="btn-mono-outline btn-sm" (click)="isEditing = false">
                                        CANCELAR
                                    </button>
                                    <button class="btn-mono-danger btn-sm" (click)="resetConfig()">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="p-5">
                                <div class="row g-5">
                                    <!-- INFO LEFT -->
                                    <div class="col-md-7">
                                        <div class="info-group mb-4">
                                            <label class="label-mono">TITULAR</label>
                                            <p class="detail-value text-uppercase">{{ config.cert_sujeto || 'S/N' }}</p>
                                        </div>
                                        <div class="info-group mb-4">
                                            <label class="label-mono">ENTIDAD</label>
                                            <p class="detail-value small">{{ config.cert_emisor || 'S/E' }}</p>
                                        </div>
                                        <div class="row">
                                            <div class="col-6">
                                                <label class="label-mono">ACTIVACIÓN</label>
                                                <p class="detail-value small">{{ config.fecha_activacion_cert | date:'dd/MM/yyyy' }}</p>
                                            </div>
                                            <div class="col-6">
                                                <label class="label-mono">EXPIRACIÓN</label>
                                                <p class="detail-value small" [class.text-danger]="isExpired">
                                                    {{ config.fecha_expiracion_cert | date:'dd/MM/yyyy' }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- SRI PARAMS RIGHT -->
                                    <div class="col-md-5 border-start-mono">
                                        <div *ngIf="!isEditing" class="sri-display-mode fade-in">
                                            <div class="info-group mb-4">
                                                <label class="label-mono">AMBIENTE</label>
                                                <div class="mono-badge" [class.badge-active]="config.ambiente === 'PRODUCCION'">
                                                    {{ config.ambiente }}
                                                </div>
                                            </div>
                                            <div class="info-group">
                                                <label class="label-mono">EMISIÓN</label>
                                                <div class="mono-badge">
                                                    {{ config.tipo_emision }}
                                                </div>
                                            </div>
                                        </div>

                                        <div *ngIf="isEditing" class="sri-edit-mode fade-in">
                                            <form (ngSubmit)="onUpdateParams()">
                                                <div class="mb-4">
                                                    <label class="label-mono">AMBIENTE</label>
                                                    <select class="input-mono" [(ngModel)]="updateParams.ambiente" name="upd_ambiente">
                                                        <option value="PRUEBAS">PRUEBAS</option>
                                                        <option value="PRODUCCION">PRODUCCION</option>
                                                    </select>
                                                </div>
                                                <div class="mb-5">
                                                    <label class="label-mono">EMISIÓN</label>
                                                    <select class="input-mono" [(ngModel)]="updateParams.tipo_emision" name="upd_emision">
                                                        <option value="NORMAL">NORMAL</option>
                                                        <option value="CONTINGENCIA">CONTINGENCIA</option>
                                                    </select>
                                                </div>
                                                <button type="submit" class="btn-mono-primary w-100" [disabled]="isUpdating">
                                                    {{ isUpdating ? 'GUARDANDO...' : 'GUARDAR' }}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `,
    styles: [`
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

        .btn-mono-outline {
            background: transparent; color: #000; border: 1px solid #000;
            border-radius: 6px; padding: 0.4rem 0.8rem; font-weight: 700;
            font-size: 0.7rem; transition: all 0.2s;
        }

        .btn-mono-outline:hover { background: #000; color: #fff; }

        .btn-mono-danger {
            background: transparent; color: #e53e3e; border: 1px solid #e53e3e;
            border-radius: 6px; padding: 0.4rem 0.6rem; font-size: 0.8rem;
        }

        .btn-mono-danger:hover { background: #e53e3e; color: #fff; }

        .detail-value { font-weight: 700; color: #111; margin-bottom: 0; }
        .x-small { font-size: 0.7rem; }

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
    `]
})
export class CertificadoSriPage implements OnInit, OnDestroy {
    config: ConfigSRI | null = null;
    loading = true;
    isSaving = false;
    isUpdating = false;
    isEditing = false;
    isDragging = false;
    showPassword = false;

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

    constructor(
        private sriService: SriConfigService,
        private authFacade: AuthFacade,
        private uiService: UiService
    ) { }

    ngOnInit() {
        this.cargarConfiguracion();
    }

    ngOnDestroy() {
        this.userSub?.unsubscribe();
    }

    get isExpired(): boolean {
        if (!this.config) return false;
        return new Date(this.config.fecha_expiracion_cert) < new Date();
    }

    private cargarConfiguracion() {
        this.loading = true;
        this.sriService.obtenerConfiguracion()
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (data) => {
                    this.config = data;
                    if (data) {
                        this.updateParams = {
                            ambiente: data.ambiente,
                            tipo_emision: data.tipo_emision
                        };
                    }
                },
                error: (err) => {
                    console.error('SRI Load Error:', err);
                    this.uiService.showError(err, 'No se pudo cargar la configuración');
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
                    this.uiService.showToast('Certificado activado', 'success');
                    this.password = '';
                    this.selectedFile = null;
                    this.fileSelected = false;
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

    resetConfig() {
        if (confirm('¿Desea eliminar esta configuración y vincular una nueva firma?')) {
            this.config = null;
            this.fileSelected = false;
            this.selectedFileName = '';
            this.password = '';
        }
    }
}
