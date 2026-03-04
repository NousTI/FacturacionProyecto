import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, delay, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface SriCertConfig {
    id: string;
    empresa_id: string;
    empresa_nombre: string; // Joined field
    empresa_ruc: string;    // Joined field
    ambiente: 'PRUEBAS' | 'PRODUCCION';
    tipo_emision: 'NORMAL' | 'CONTINGENCIA';
    fecha_expiracion_cert: Date | string;
    fecha_activacion_cert?: Date | string;
    estado: 'ACTIVO' | 'INACTIVO' | 'EXPIRADO' | 'REVOCADO';
    cert_serial: string;
    cert_emisor: string;
    cert_sujeto: string;
    updated_at: Date | string;
    created_at?: Date | string;
    days_until_expiry?: number; // Calculated
}

export interface SriCertAudit {
    id: string;
    configuracion_sri_id: string;
    empresa_id: string;
    user_id?: string;
    user_name?: string;
    accion: 'CREATE' | 'UPDATE' | 'DELETE';
    snapshot_before?: any;
    snapshot_after?: any;
    created_at: Date;
    ip_origen?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SriCertService {
    private apiUrl = `${environment.apiUrl}/sri`;
    
    // Store temporary data to mock audit logs and calculate stats if needed
    private curCerts: SriCertConfig[] = [];

    constructor(private http: HttpClient) {}

    getCerts(): Observable<SriCertConfig[]> {
        return this.http.get<any>(`${this.apiUrl}/configuracion/list`).pipe(
            map(response => {
                let certs: SriCertConfig[] = response.detalles || [];
                
                // Recalculate days until expiry dynamically
                const now = new Date();
                certs = certs.map(c => {
                    let days = 0;
                    if (c.fecha_expiracion_cert) {
                        const expiry = new Date(c.fecha_expiracion_cert);
                        const diffTime = expiry.getTime() - now.getTime();
                        days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    }
                    return { ...c, days_until_expiry: days };
                });
                
                this.curCerts = certs;
                return certs;
            }),
            catchError(err => {
                console.error("Error al obtener certificados:", err);
                return throwError(() => err);
            })
        );
    }

    getStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/configuracion/stats`).pipe(
            map(response => response.detalles || { total: 0, active: 0, expiring: 0, expired: 0 }),
            catchError(err => {
                console.error("Error al obtener estadísticas:", err);
                return throwError(() => err);
            })
        );
    }

    getAuditLogs(certId: string): Observable<SriCertAudit[]> {
        // En un caso real, llamar a un endpoint como `/sri/configuracion/${certId}/audit`
        // Como no está implementado en la especificación, devolvemos un log simulado genérico para la demo
        const now = new Date();
        const mockAudit: SriCertAudit[] = [
            {
                id: `audit-1`,
                configuracion_sri_id: certId,
                empresa_id: 'emp-unknown',
                user_name: 'SysAdmin',
                accion: 'CREATE',
                created_at: new Date(now.getTime() - 86400000), // Ayer
                ip_origen: 'Sistema'
            }
        ];
        return of(mockAudit).pipe(delay(400));
    }
}
