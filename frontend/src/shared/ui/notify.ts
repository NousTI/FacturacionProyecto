import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: number;
    type: NotificationType;
    message: string;
    description?: string;
}

class NotifyService {
    private notificationsSubject = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();
    private counter = 0;

    success(message: string, description?: string) {
        this.add('success', message, description);
    }

    error(message: string, description?: string) {
        this.add('error', message, description);
    }

    warning(message: string, description?: string) {
        this.add('warning', message, description);
    }

    info(message: string, description?: string) {
        this.add('info', message, description);
    }

    private add(type: NotificationType, message: string, description?: string) {
        const id = ++this.counter;
        const current = this.notificationsSubject.value;
        this.notificationsSubject.next([...current, { id, type, message, description }]);

        // Auto-remove after 5 seconds
        setTimeout(() => this.remove(id), 5000);
    }

    public remove(id: number) {
        const filtered = this.notificationsSubject.value.filter(n => n.id !== id);
        this.notificationsSubject.next(filtered);
    }
}

export const notify = new NotifyService();
