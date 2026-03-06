import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { map } from 'rxjs/operators';

export interface AlertaVendedor {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  accion_url?: string;
}

export interface VendedorHomeData {
  alertas: AlertaVendedor[];
}

@Injectable({
  providedIn: 'root'
})
export class VendedorHomeService {
  private apiUrl = `${environment.apiUrl}/vendedores`;

  constructor(private http: HttpClient) {}

  getHomeData(): Observable<VendedorHomeData> {
    return this.http.get<{data: VendedorHomeData}>(`${this.apiUrl}/me/home-data`).pipe(
      map(res => res.data)
    );
  }
}
