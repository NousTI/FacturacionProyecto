import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';

export interface TestItem {
  id: string;
  nombre: string;
  valor: number;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private mockData: TestItem[] = [
    { id: '1', nombre: 'Mockup Frontend A', valor: 100, activo: true },
    { id: '2', nombre: 'Mockup Frontend B', valor: 200, activo: true },
    { id: '3', nombre: 'Mockup Frontend C', valor: 300, activo: false }
  ];

  constructor() { }

  getTestItems(): Observable<TestItem[]> {
    return of(this.mockData);
  }
}
