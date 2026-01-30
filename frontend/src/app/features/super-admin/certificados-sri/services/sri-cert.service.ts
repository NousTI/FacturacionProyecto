import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';

export interface SriCertConfig {
    id: string;
    empresa_id: string;
    empresa_nombre: string; // Joined field
    empresa_ruc: string;    // Joined field
    ambiente: 'PRUEBAS' | 'PRODUCCION';
    tipo_emision: 'NORMAL' | 'CONTINGENCIA';
    fecha_expiracion_cert: Date;
    estado: 'ACTIVO' | 'INACTIVO' | 'EXPIRADO' | 'REVOCADO';
    cert_serial: string;
    cert_emisor: string;
    cert_sujeto: string;
    updated_at: Date;
    days_until_expiry?: number; // Calculated
}

export interface SriCertAudit {
    id: string;
    configuracion_sri_id: string;
    empresa_id: string;
    user_id?: string;
    user_name?: string; // Mocked
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
    private mockData: SriCertConfig[] = [];
    private mockAudit: SriCertAudit[] = [];

    constructor() {
        this.generateMockData();
    }

    private generateMockData() {
        const companies = [
            { name: 'Tech Solutions S.A.', ruc: '1792134567001' },
            { name: 'Distribuidora Global', ruc: '0990012345001' },
            { name: 'Consultora Expertos', ruc: '0190054321001' },
            { name: 'MegaMarket Ecuador', ruc: '1191234567001' },
            { name: 'Servicios Rápidos', ruc: '1798765432001' },
            { name: 'Farmacias Unidas', ruc: '0998761234001' },
            { name: 'Constructora Elite', ruc: '0191239876001' },
            { name: 'Restaurante Delicias', ruc: '1790011223001' },
            { name: 'Transportes Veloces', ruc: '0992233445001' },
            { name: 'Inmobiliaria Futuro', ruc: '0193344556001' },
            { name: 'Importadora y Exportadora XYZ', ruc: '1799988776001' },
            { name: 'SoftDev Corp', ruc: '0998877665001' }
        ];

        const now = new Date();

        this.mockData = companies.map((comp, index) => {
            // Randomize expiration dates
            const daysOffset = Math.floor(Math.random() * 400) - 50; // -50 to +350 days
            const expiryDate = new Date(now);
            expiryDate.setDate(now.getDate() + daysOffset);

            let estado: any = 'ACTIVO';
            if (daysOffset < 0) estado = 'EXPIRADO';
            else if (Math.random() > 0.9) estado = 'INACTIVO';

            return {
                id: `cert-${index + 1}`,
                empresa_id: `emp-${index + 1}`,
                empresa_nombre: comp.name,
                empresa_ruc: comp.ruc,
                ambiente: Math.random() > 0.2 ? 'PRODUCCION' : 'PRUEBAS',
                tipo_emision: 'NORMAL',
                fecha_expiracion_cert: expiryDate,
                estado: estado,
                cert_serial: `2024-${1000 + index}`,
                cert_emisor: 'BANCO CENTRAL DEL ECUADOR',
                cert_sujeto: `CN=${comp.name},OU=Firma Digital,O=Security Data`,
                updated_at: new Date(now.getTime() - Math.floor(Math.random() * 1000000000))
            };
        });

        // Generate Audit Logs
        this.mockAudit = Array.from({ length: 50 }).map((_, i) => ({
            id: `audit-${i}`,
            configuracion_sri_id: `cert-${Math.floor(Math.random() * this.mockData.length) + 1}`,
            empresa_id: `emp-${Math.floor(Math.random() * this.mockData.length) + 1}`,
            user_name: 'Admin Sistema',
            accion: Math.random() > 0.7 ? 'UPDATE' : 'CREATE',
            created_at: new Date(now.getTime() - Math.floor(Math.random() * 5000000000)),
            ip_origen: '192.168.1.10'
        }));
    }

    getCerts(): Observable<SriCertConfig[]> {
        // Recalculate days until expiry dynamically
        const now = new Date();
        const data = this.mockData.map(c => {
            const diffTime = c.fecha_expiracion_cert.getTime() - now.getTime();
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...c, days_until_expiry: days };
        });
        return of(data).pipe(delay(600)); // Simulate latency
    }

    getStats(): Observable<any> {
        return this.getCerts().pipe(
            map(certs => {
                const total = certs.length;
                const active = certs.filter(c => c.estado === 'ACTIVO' && (c.days_until_expiry || 0) > 30).length;
                const expiring = certs.filter(c => c.estado === 'ACTIVO' && (c.days_until_expiry || 0) <= 30 && (c.days_until_expiry || 0) >= 0).length;
                const expired = certs.filter(c => c.estado === 'EXPIRADO' || (c.days_until_expiry || 0) < 0).length;

                return { total, active, expiring, expired };
            })
        );
    }

    getAuditLogs(certId: string): Observable<SriCertAudit[]> {
        return of(this.mockAudit
            .filter(a => a.configuracion_sri_id === certId)
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
        ).pipe(delay(400));
    }
}
