import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
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
  dañado: number;
  en_transito: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class InventarioStockService extends BaseApiService {
  private readonly ENDPOINT = 'inventarios/stock';
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
    return this.get<InventarioStock[]>(this.ENDPOINT).pipe(
      tap(inventarios => this.inventarios$.next(inventarios))
    );
  }

  obtenerResumen(): Observable<StockResumen[]> {
    return this.get<StockResumen[]>(`${this.ENDPOINT}/resumen`).pipe(
      tap(resumen => this.resumen$.next(resumen))
    );
  }

  obtener(id: string): Observable<InventarioStock> {
    return this.get<InventarioStock>(`${this.ENDPOINT}/${id}`);
  }

  crear(datos: Omit<InventarioStock, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>): Observable<InventarioStock> {
    return this.post<InventarioStock>(this.ENDPOINT, datos).pipe(
      tap(() => this.recargar())
    );
  }

  actualizar(id: string, datos: Partial<Omit<InventarioStock, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>>): Observable<InventarioStock> {
    return this.put<InventarioStock>(`${this.ENDPOINT}/${id}`, datos).pipe(
      tap(() => this.recargar())
    );
  }

  eliminar(id: string): Observable<any> {
    return this.delete<any>(`${this.ENDPOINT}/${id}`).pipe(
      tap(() => this.recargar())
    );
  }

  recargar(): void {
    this.listar().subscribe();
    this.obtenerResumen().subscribe();
  }
}
