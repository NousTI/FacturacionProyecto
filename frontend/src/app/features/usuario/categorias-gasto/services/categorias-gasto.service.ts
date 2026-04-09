import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, filter } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { CategoriaGasto, CategoriaGastoCreate, CategoriaGastoUpdate } from '../../../../domain/models/categoria-gasto.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriasGastoService extends BaseApiService {
  private readonly ENDPOINT = 'categoria-gasto';

  private _categorias$ = new BehaviorSubject<CategoriaGasto[] | null>(null);
  private _loaded = false;

  constructor(http: HttpClient) {
    super(http);
  }

  get categorias$() {
    return this._categorias$.pipe(
      filter(data => data !== null),
      map(data => data as CategoriaGasto[])
    );
  }

  loadInitialData(): void {
    if (this._loaded) return;

    this.get<ApiResponse<CategoriaGasto[]>>(this.ENDPOINT).subscribe(resp => {
      if (resp && resp.detalles) {
        this._categorias$.next(resp.detalles);
        this._loaded = true;
      }
    });
  }

  getCategorias(): Observable<CategoriaGasto[]> {
    if (!this._loaded) {
      this.loadInitialData();
    }
    return this.categorias$;
  }

  createCategoria(categoria: CategoriaGastoCreate): Observable<CategoriaGasto> {
    return this.post<ApiResponse<CategoriaGasto>>(this.ENDPOINT, categoria).pipe(
      map(resp => resp.detalles),
      tap(newCat => {
        if (newCat) {
          const current = this._categorias$.value || [];
          this._categorias$.next([newCat, ...current]);
        }
      })
    );
  }

  updateCategoria(id: string, categoria: CategoriaGastoUpdate): Observable<CategoriaGasto> {
    return this.put<ApiResponse<CategoriaGasto>>(`${this.ENDPOINT}/${id}`, categoria).pipe(
      map(resp => resp.detalles),
      tap(updatedCat => {
        if (updatedCat) {
          const current = this._categorias$.value || [];
          const index = current.findIndex(c => c.id === id);
          if (index !== -1) {
            current[index] = updatedCat;
            this._categorias$.next([...current]);
          }
        }
      })
    );
  }

  deleteCategoria(id: string): Observable<ApiResponse<null>> {
    return this.delete<ApiResponse<null>>(`${this.ENDPOINT}/${id}`).pipe(
      tap(() => {
        const current = this._categorias$.value || [];
        this._categorias$.next(current.filter(c => c.id !== id));
      })
    );
  }

  refresh(): void {
    this._loaded = false;
    this.loadInitialData();
  }
}
