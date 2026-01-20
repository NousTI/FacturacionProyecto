// frontend-ng/src/app/core/services/configuracion.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Parametro {
    id: string;
    clave: string;
    valor: string;
    descripcion?: string;
    categoria: string;
}

export interface FeatureFlag {
    id: string;
    codigo: string;
    activo: boolean;
    descripcion?: string;
}

import { AppConfig } from '../config/app.config';

@Injectable({
    providedIn: 'root'
})
export class ConfiguracionService {
    private http = inject(HttpClient);
    private apiUrl = `${AppConfig.apiUrl}/configuracion`;

    getParametros(): Observable<Parametro[]> {
        return this.http.get<Parametro[]>(`${this.apiUrl}/parametros`);
    }

    updateParametro(clave: string, valor: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/parametros/${clave}`, { valor });
    }

    getFlags(): Observable<FeatureFlag[]> {
        return this.http.get<FeatureFlag[]>(`${this.apiUrl}/flags`);
    }

    updateFlag(codigo: string, activo: boolean): Observable<any> {
        return this.http.put(`${this.apiUrl}/flags/${codigo}`, { activo });
    }

    getCatalogos(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/catalogos`);
    }

    getPlantillas(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/plantillas`);
    }
}
