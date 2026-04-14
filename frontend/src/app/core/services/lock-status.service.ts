import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type LockType = 'COMPANY_DISABLED' | 'SUBSCRIPTION_VENCIDA' | 'SUBSCRIPTION_CANCELADA' | 'SUBSCRIPTION_SUSPENDIDA' | 'SUBSCRIPTION_INEXISTENTE' | null;

export interface LockInfo {
  type: LockType;
  title: string;
  message: string;
  icon: string;
  phone?: string;
  whatsappMessage?: string;
  showSupport?: boolean;
  showPayments?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LockStatusService {
  private _lock$ = new BehaviorSubject<LockInfo | null>(null);
  lock$ = this._lock$.asObservable();

  private _showModal$ = new BehaviorSubject<boolean>(false);
  showModal$ = this._showModal$.asObservable();

  setLock(type: LockType, data?: { phone?: string; message?: string }) {
    if (!type) {
      this._lock$.next(null);
      return;
    }

    const info = this.getLockInfo(type);
    if (data) {
      if (data.phone) info.phone = data.phone;
      if (data.message) info.whatsappMessage = data.message;
    }
    this._lock$.next(info);
  }

  getLockInfoSync(type: LockType): LockInfo {
    return this.getLockInfo(type);
  }

  private getLockInfo(type: LockType): LockInfo {
    switch (type) {
      case 'COMPANY_DISABLED':
        return {
          type,
          title: 'Empresa Inhabilitada',
          message: 'Su cuenta de empresa ha sido desactivada por un administrador del sistema. Por favor, contacte a soporte para más información.',
          icon: 'bi-building-dash',
          showSupport: true
        };
      case 'SUBSCRIPTION_VENCIDA':
        return {
          type,
          title: 'Suscripción Vencida',
          message: 'Su periodo de suscripción ha finalizado. Renueve su plan para seguir emitiendo comprobantes y accediendo a sus datos.',
          icon: 'bi-calendar-x',
          showPayments: true
        };
      case 'SUBSCRIPTION_CANCELADA':
        return {
          type,
          title: 'Suscripción Cancelada',
          message: 'Su suscripción ha sido cancelada. Para reactivar el servicio, por favor seleccione un nuevo plan.',
          icon: 'bi-x-circle',
          showPayments: true
        };
      case 'SUBSCRIPTION_SUSPENDIDA':
        return {
          type,
          title: 'Suscripción Suspendida',
          message: 'Su cuenta ha sido suspendida temporalmente por falta de pago o incumplimiento de términos.',
          icon: 'bi-pause-circle',
          showSupport: true,
          showPayments: true
        };
      case 'SUBSCRIPTION_INEXISTENTE':
        return {
          type,
          title: 'Sin Suscripción Activa',
          message: 'No cuenta con una suscripción activa vinculada a su empresa. Debe contratar un plan para comenzar a facturar.',
          icon: 'bi-cart-plus',
          showPayments: true
        };
      default:
        return {
          type,
          title: 'Acceso Restringido',
          message: 'No tiene permisos para acceder a esta sección en este momento debido al estado de su cuenta.',
          icon: 'bi-lock',
          showSupport: true
        };
    }
  }

  clearLock() {
    this._lock$.next(null);
  }

  setShowModal(show: boolean) {
    this._showModal$.next(show);
  }

  closeModal() {
    this._showModal$.next(false);
  }
}
