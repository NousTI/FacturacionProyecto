import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    message: string;
    description?: string;
    type: 'success' | 'danger' | 'warning' | 'info';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class UiService {
    private toastSubject = new BehaviorSubject<Toast | null>(null);
    toast$ = this.toastSubject.asObservable();

    showToast(message: string, type: Toast['type'] = 'success', description?: string, duration: number = 5000) {
        this.toastSubject.next({ message, description, type, duration });

        if (duration > 0) {
            setTimeout(() => {
                this.toastSubject.next(null);
            }, duration);
        }
    }

    /**
     * Centralized method to handle backend errors
     * @param err The HttpErrorResponse object
     * @param defaultTitle A fallback title if no message is found
     */
    showError(err: any, defaultTitle: string = 'Error de Operación') {
        let title = defaultTitle;
        let description = '';

        if (err.error) {
            // Handle AppError format
            if (err.error.mensaje) title = err.error.mensaje;
            if (err.error.descripcion) description = err.error.descripcion;

            // Handle standard FastAPI detail errors
            if (!err.error.mensaje && err.error.detail) {
                if (typeof err.error.detail === 'string') {
                    description = err.error.detail;
                } else if (Array.isArray(err.error.detail)) {
                    description = err.error.detail.map((e: any) => e.msg).join(', ');
                }
            }
        } else if (err.message) {
            description = err.message;
        }

        this.showToast(title, 'danger', description, 5000);
    }

    hideToast() {
        this.toastSubject.next(null);
    }
}
