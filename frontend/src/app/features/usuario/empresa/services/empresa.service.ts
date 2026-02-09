import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from '../../../../core/api/base-api.service';
import { Empresa, EmpresaUpdate } from '../../../../domain/models/empresa.model';
import { ApiResponse } from '../../../../core/api/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService extends BaseApiService {
  private readonly ENDPOINT = 'empresas';

  constructor(http: HttpClient) {
    super(http);
  }

  getEmpresa(id: string): Observable<Empresa> {
    return this.get<Empresa>(`${this.ENDPOINT}/${id}`);
  }

  getEmpresas(): Observable<Empresa[]> {
    return this.get<Empresa[]>(this.ENDPOINT);
  }

  createEmpresa(data: Partial<Empresa>): Observable<Empresa> {
    return this.post<Empresa>(this.ENDPOINT, data);
  }

  updateEmpresa(id: string, data: EmpresaUpdate): Observable<Empresa> {
    return this.patch<Empresa>(`${this.ENDPOINT}/${id}`, data);
  }

  deleteEmpresa(id: string): Observable<any> {
    return this.delete(`${this.ENDPOINT}/${id}`);
  }
}
