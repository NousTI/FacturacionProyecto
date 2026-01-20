// frontend-ng/src/app/features/dashboard/components/configuracion-sistema/configuracion-sistema.component.ts

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService, Parametro, FeatureFlag } from '../../../../core/services/configuracion.service';
import { FeedbackService } from '../../../../shared/services/feedback.service';

@Component({
    selector: 'app-configuracion-sistema',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './configuracion-sistema.component.html',
    styleUrl: './configuracion-sistema.component.css'
})
export class ConfiguracionSistemaComponent implements OnInit {
    private configService = inject(ConfiguracionService);
    private feedback = inject(FeedbackService);

    activeTab = signal<'parametros' | 'flags' | 'catalogos' | 'plantillas'>('parametros');
    parametros = signal<Parametro[]>([]);
    flags = signal<FeatureFlag[]>([]);
    catalogos = signal<any[]>([]);
    plantillas = signal<any[]>([]);
    loading = signal(false);
    saving = signal(false);

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.loading.set(true);
        this.configService.getParametros().subscribe({
            next: (p: Parametro[]) => this.parametros.set(p),
            complete: () => this.loading.set(false)
        });
        this.configService.getFlags().subscribe((f: FeatureFlag[]) => this.flags.set(f));
        this.configService.getCatalogos().subscribe((c: any[]) => this.catalogos.set(c));
        this.configService.getPlantillas().subscribe((pl: any[]) => this.plantillas.set(pl));
    }

    updateParametro(p: Parametro) {
        this.saving.set(true);
        this.configService.updateParametro(p.clave, p.valor).subscribe({
            next: () => {
                this.saving.set(false);
                this.feedback.showSuccess(`Parámetro ${p.clave} actualizado`);
            },
            error: () => {
                this.saving.set(false);
                this.feedback.showError('Error al actualizar parámetro');
            }
        });
    }

    toggleFlag(f: FeatureFlag) {
        this.configService.updateFlag(f.codigo, f.activo).subscribe({
            next: () => this.feedback.showSuccess(`Flag ${f.codigo} actualizado`),
            error: () => {
                f.activo = !f.activo; // Revert on error
                this.feedback.showError('Error al actualizar flag');
            }
        });
    }
}
