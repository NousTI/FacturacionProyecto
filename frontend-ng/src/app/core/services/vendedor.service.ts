import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Vendedor {
    id: string;
    email: string;
    nombres: string;
    apellidos: string;
    activo: boolean;
    telefono?: string;
}

@Injectable({
    providedIn: 'root'
})
export class VendedorService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8000/api/vendedores';

    getVendedores(): Observable<Vendedor[]> {
        return this.http.get<Vendedor[]>(this.apiUrl);
    }
}
