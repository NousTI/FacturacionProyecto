import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private apiUrl = `${environment.apiUrl}/reportes`;
  private cache = new Map<string, any>();

  constructor(private http: HttpClient) { }

  private getCacheKey(endpoint: string, params: any): string {
    return `${endpoint}_${JSON.stringify(params)}`;
  }

  getVentasGeneral(params: any): Observable<any> {
    const key = this.getCacheKey('general', params);
    if (this.cache.has(key)) return of(this.cache.get(key));

    let httpParams = new HttpParams();
    Object.keys(params).forEach(k => {
      if (params[k]) httpParams = httpParams.append(k, params[k]);
    });
    return this.http.get<any>(`${this.apiUrl}/ventas/general`, { params: httpParams })
      .pipe(tap(res => this.cache.set(key, res)));
  }

  getVentasMensuales(anio: number): Observable<any[]> {
    const key = this.getCacheKey('mensuales', { anio });
    if (this.cache.has(key)) return of(this.cache.get(key));

    return this.http.get<any[]>(`${this.apiUrl}/ventas/mensuales`, { params: { anio } })
      .pipe(tap(res => this.cache.set(key, res)));
  }

  getVentasPorUsuario(params: any): Observable<any> {
    const key = this.getCacheKey('usuarios', params);
    if (this.cache.has(key)) return of(this.cache.get(key));

    let httpParams = new HttpParams();
    Object.keys(params).forEach(k => {
      if (params[k]) httpParams = httpParams.append(k, params[k]);
    });
    return this.http.get<any>(`${this.apiUrl}/ventas/usuarios`, { params: httpParams })
      .pipe(tap(res => this.cache.set(key, res)));
  }

  getFacturasAnuladas(params: any): Observable<any[]> {
    const key = this.getCacheKey('anuladas', params);
    if (this.cache.has(key)) return of(this.cache.get(key));

    let httpParams = new HttpParams();
    Object.keys(params).forEach(k => {
      if (params[k]) httpParams = httpParams.append(k, params[k]);
    });
    return this.http.get<any[]>(`${this.apiUrl}/ventas/anuladas`, { params: httpParams })
      .pipe(tap(res => this.cache.set(key, res)));
  }

  getFacturasRechazadas(params: any): Observable<any[]> {
    const key = this.getCacheKey('rechazadas', params);
    if (this.cache.has(key)) return of(this.cache.get(key));

    let httpParams = new HttpParams();
    Object.keys(params).forEach(k => {
      if (params[k]) httpParams = httpParams.append(k, params[k]);
    });
    return this.http.get<any[]>(`${this.apiUrl}/ventas/rechazadas-sri`, { params: httpParams })
      .pipe(tap(res => this.cache.set(key, res)));
  }

  clearCache() {
    this.cache.clear();
  }

  exportarReporte(tipo: string, formato: string, params: any): Observable<Blob> {
    let httpParams = new HttpParams()
      .set('tipo', tipo)
      .set('formato', formato);
    
    Object.keys(params).forEach(key => {
      if (params[key]) httpParams = httpParams.append(key, params[key]);
    });

    return this.http.get(`${this.apiUrl}/exportar`, { 
      params: httpParams, 
      responseType: 'blob' 
    });
  }
}
