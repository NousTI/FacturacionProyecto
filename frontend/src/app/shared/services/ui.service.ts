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

    showToast(message: string, type: Toast['type'] = 'success', description?: string, duration: number = 3000) {
        this.toastSubject.next({ message, description, type, duration });

        if (duration > 0) {
            setTimeout(() => {
                this.toastSubject.next(null);
            }, duration);
        }
    }

    hideToast() {
        this.toastSubject.next(null);
    }
}
