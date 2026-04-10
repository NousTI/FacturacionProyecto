import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';

export interface InventarioStock {
  id: string;
  empresa_id: string;
  producto_id: string;
  tipo_movimiento: 'COMPRA' | 'VENTA' | 'DEVOLUCION';
  unidad_medida: 'UNIDAD' | 'CAJA' | 'BULTO' | 'KILO' | 'METRO' | 'LITRO';
  cantidad: number;
  estado: 'DISPONIBLE' | 'RESERVADO' | 'DAÑADO' | 'EN_TRANSITO';
  ubicacion_fisica?: string;
  observaciones?: string;
  fecha: string;
  created_at: string;
  updated_at: string;
  producto_nombre?: string;
  producto_codigo?: string;
}

export interface StockResumen {
  id: string;
  nombre: string;
  codigo: string;
  disponible: number;
  reservado: number;
  danado: number;
  en_transito: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class InventarioStockService extends BaseApiService {
  private readonly ENDPOINT = 'inventarios/stock/';
  private inventarios$ = new BehaviorSubject<InventarioStock[]>([]);
  private resumen$ = new BehaviorSubject<StockResumen[]>([]);

  constructor(http: HttpClient) {
    super(http);
  }

  getInventarios(): Observable<InventarioStock[]> {
    return this.inventarios$.asObservable();
  }

  getResumen(): Observable<StockResumen[]> {
    return this.resumen$.asObservable();
  }

  listar(): Observable<InventarioStock[]> {
    return this.get<any>(this.ENDPOINT).pipe(
      map(response => response.detalles || []),
      tap(inventarios => this.inventarios$.next(inventarios))
    );
  }

  obtenerResumen(): Observable<StockResumen[]> {
    return this.get<any>(`${this.ENDPOINT}resumen`).pipe(
      map(response => response.detalles || []),
      tap(resumen => this.resumen$.next(resumen))
    );
  }

  obtener(id: string): Observable<InventarioStock> {
    return this.get<any>(`${this.ENDPOINT}${id}`).pipe(
      map(response => response.detalles || response)
    );
  }

  crear(datos: Omit<InventarioStock, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>): Observable<InventarioStock> {
    return this.post<any>(this.ENDPOINT, datos).pipe(
      map(response => response.detalles || response),
      tap(() => this.recargar())
    );
  }

  actualizar(id: string, datos: Partial<Omit<InventarioStock, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>>): Observable<InventarioStock> {
    return this.put<any>(`${this.ENDPOINT}${id}`, datos).pipe(
      map(response => response.detalles || response),
      tap(() => this.recargar())
    );
  }

  eliminar(id: string): Observable<any> {
    return this.delete<any>(`${this.ENDPOINT}${id}`).pipe(
      tap(() => this.recargar())
    );
  }

  recargar(): void {
    this.listar().subscribe();
    this.obtenerResumen().subscribe();
  }
}
