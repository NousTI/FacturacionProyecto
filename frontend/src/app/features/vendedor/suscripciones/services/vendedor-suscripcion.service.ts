import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { VendedorEmpresaService } from '../../empresas/services/vendedor-empresa.service';

export interface Suscripcion {
    id: string;
    empresa_id: string;
    empresa_nombre: string;
    plan_id: string;
    plan_nombre: string;
    precio_plan: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA' | 'CANCELADA';
    estado_pago?: 'PAGADO' | 'PENDIENTE' | 'ANULADO' | 'REEMBOLSADO';
    created_at: string;
    updated_at: string;
    days_overdue?: number;
    last_payment?: {
        date: string;
        amount: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class VendedorSuscripcionService {

    constructor(
        private empresaService: VendedorEmpresaService
    ) { }

    getMySuscripciones(): Observable<Suscripcion[]> {
        this.empresaService.loadMyEmpresas(); // Ensure data is loaded
        return this.empresaService.getEmpresas().pipe(
            map(empresas => empresas.map(e => this.mapEmpresaToSuscripcion(e)))
        );
    }

    private mapEmpresaToSuscripcion(e: any): Suscripcion {
        const fechaFin = e.fechaVencimiento ? new Date(e.fechaVencimiento) : null;
        const now = new Date();
        const isOverdue = fechaFin ? fechaFin < now : false;

        // Determine status based on active flag and expiration
        let status: any = e.activo ? 'ACTIVA' : 'SUSPENDIDA';
        if (e.activo && isOverdue) {
            status = 'VENCIDA';
        }

        // Calculate days overdue
        let daysOverdue = 0;
        if (isOverdue && fechaFin) {
            const diffTime = Math.abs(now.getTime() - fechaFin.getTime());
            daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
            id: e.id, // Subscription ID is tied to Company ID in this model
            empresa_id: e.id,
            empresa_nombre: e.razonSocial,
            plan_id: e.planId,
            plan_nombre: e.plan,
            precio_plan: e.precioPlan,
            fecha_inicio: e.created_at, // Approximate
            fecha_fin: e.fechaVencimiento,
            estado: status,
            created_at: e.created_at,
            updated_at: e.updated_at,
            days_overdue: daysOverdue,
            estado_pago: (e.ultimoPagoEstado || 'PENDIENTE') as any,
            last_payment: e.ultimoPagoFecha ? {
                date: e.ultimoPagoFecha,
                amount: e.ultimoPagoMonto
            } : undefined
        };
    }
}
