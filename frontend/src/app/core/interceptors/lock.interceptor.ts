import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LockStatusService } from '../services/lock-status.service';

@Injectable()
export class LockInterceptor implements HttpInterceptor {
  constructor(private lockService: LockStatusService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        const isLogout = request.url.includes('/autenticacion/cerrar-sesion');
        const isCurrentlyLoggingOut = this.lockService.isLoggingOutValue;

        if (!isLogout && !isCurrentlyLoggingOut && (error.status === 402 || error.status === 403)) {
          try {
            const data = JSON.parse(error.error.detail);
            if (data.type) {
              this.lockService.setLock(data.type, { 
                phone: data.phone, 
                message: data.message 
              });
            }
          } catch (e) {
            // Fallback si no es JSON
            const detail = error.error?.detail || '';
            if (detail === 'COMPANY_DISABLED') {
              this.lockService.setLock('COMPANY_DISABLED');
            } else if (error.status === 402) {
              this.lockService.setLock('SUBSCRIPTION_VENCIDA');
            }
          }
        }
        return throwError(() => error);
      })
    );
  }
}
