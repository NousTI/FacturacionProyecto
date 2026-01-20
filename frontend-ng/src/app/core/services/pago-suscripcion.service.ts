import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// TODO: Move to environment
import { AppConfig } from '../config/app.config';

const API_URL = AppConfig.apiUrl;

export interface PagoSuscripcion {
    id: string;
    empresa_id: string;
    plan_id: string;
    monto: number;
    fecha_pago: string;
    fecha_inicio_periodo: string;
    fecha_fin_periodo: string;
    metodo_pago: string;
    estado: string;
    empresa_nombre?: string;
    plan_nombre?: string;
    numero_comprobante?: string;
    comprobante_url?: string;
    observaciones?: string;
    registrado_por?: string;
    created_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class PagoSuscripcionService {
    private http = inject(HttpClient);

    private pagosCache: PagoSuscripcion[] | null = null;

    getPagos(estado?: string, forceReload: boolean = false): Observable<PagoSuscripcion[]> {
        if (this.pagosCache && !forceReload && !estado) {
            return new Observable(observer => {
                observer.next(this.pagosCache!);
                observer.complete();
            });
        }

        let url = `${API_URL}/suscripciones`;
        if (estado) {
            url += `?estado=${estado}`;
        }
        return this.http.get<PagoSuscripcion[]>(url).pipe(
            map(pagos => {
                if (!estado) this.pagosCache = pagos;
                return pagos;
            })
        );
    }

    clearCache() {
        this.pagosCache = null;
    }

    registrarPagoRapido(data: {
        empresa_id: string;
        plan_id: string;
        metodo_pago: string;
        numero_comprobante?: string;
        observaciones?: string;
    }): Observable<PagoSuscripcion> {
        return this.http.post<PagoSuscripcion>(`${API_URL}/suscripciones/superadmin/quick-pay`, data);
    }

    aprobarPago(id: string): Observable<any> {
        return this.http.post(`${API_URL}/suscripciones/approve/${id}`, {});
    }

    rechazarPago(id: string, observaciones?: string): Observable<any> {
        return this.http.post(`${API_URL}/suscripciones/reject/${id}`, { observaciones });
    }
}
