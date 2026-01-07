import { Injectable, signal } from '@angular/core';

export interface FeedbackModal {
    isOpen: boolean;
    type: 'success' | 'error';
    message: string;
    onConfirm?: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class FeedbackService {
    // Signals for state
    loadingMessage = signal<string | null>(null);
    isLoading = signal<boolean>(false);

    modalState = signal<FeedbackModal>({
        isOpen: false,
        type: 'success',
        message: ''
    });

    showLoading(message: string = 'Cargando...') {
        this.loadingMessage.set(message);
        this.isLoading.set(true);
    }

    hideLoading() {
        this.isLoading.set(false);
        this.loadingMessage.set(null);
    }

    showSuccess(message: string, onConfirm?: () => void) {
        this.modalState.set({
            isOpen: true,
            type: 'success',
            message,
            onConfirm
        });
    }

    showError(message: string, onConfirm?: () => void) {
        this.modalState.set({
            isOpen: true,
            type: 'error',
            message,
            onConfirm
        });
    }

    closeModal() {
        const current = this.modalState();
        if (current.onConfirm) {
            current.onConfirm();
        }
        this.modalState.set({ ...current, isOpen: false });
    }
}
