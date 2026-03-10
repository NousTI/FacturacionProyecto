import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PerfilService {
    private apiUrl = `${environment.apiUrl}/superadmin/me`;

    private _perfil$ = new BehaviorSubject<any>(null);

    constructor(private http: HttpClient) { }

    getPerfil(): Observable<any> {
        return this._perfil$.asObservable();
    }

    loadPerfil() {
        this.http.get<any>(this.apiUrl).subscribe(response => {
           if (response && response.detalles) {
               this._perfil$.next(response.detalles);
           } else {
               this._perfil$.next(response);
           }
        });
    }

    updatePerfil(data: any): Observable<any> {
        return this.http.patch<any>(this.apiUrl, data).pipe(
            map(response => {
                if (response && response.detalles) {
                    return response.detalles;
                }
                return response;
            })
        );
    }
}
