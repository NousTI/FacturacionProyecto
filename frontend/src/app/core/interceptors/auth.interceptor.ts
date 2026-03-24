import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { UiService } from '../../shared/services/ui.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private authService: AuthService, 
        private router: Router,
        private uiService: UiService
    ) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = this.authService.getToken();

        if (token) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    this.authService.logout();
                    this.router.navigate(['/auth/login']);
                } else if (error.status === 402) {
                    // Suscripción Requerida - Mostramos error visual y redirigimos
                    this.uiService.showError(error, 'Suscripción Inactiva');
                    
                    // Solo redirigir si no estamos ya en el módulo de empresa
                    if (!this.router.url.includes('/usuario/empresa')) {
                        this.router.navigate(['/usuario/empresa']);
                    }
                } else if (error.status === 403) {
                    // Acceso Denegado (No tiene permisos)
                    let recurso = 'este módulo';
                    if (request.url) {
                        if (request.url.includes('/sri/')) recurso = 'Configuración SRI';
                        else if (request.url.includes('/puntos-emision')) recurso = 'Puntos de Emisión';
                        else if (request.url.includes('/establecimientos')) recurso = 'Establecimientos';
                        else if (request.url.includes('/usuarios')) recurso = 'Gestión de Usuarios';
                        else if (request.url.includes('/facturas')) recurso = 'Facturación';
                        else if (request.url.includes('/empresas')) recurso = 'Empresas';
                        else if (request.url.includes('/productos')) recurso = 'Productos';
                        else if (request.url.includes('/clientes')) recurso = 'Clientes';
                    }
                    
                    const serverMsg = error.error?.descripcion || error.error?.mensaje || error.error?.detail || 'Operación restringida por permisos.';
                    
                    this.uiService.showToast(
                        'Acceso Denegado', 
                        'danger', 
                        `${serverMsg} (Recurso: ${recurso})`,
                        6000
                    );
                }
                return throwError(() => error);
            })
        );
    }
}

