import { Injectable, isDevMode } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  log(message: string, ...args: any[]): void {
    if (!environment.production || isDevMode()) {

    }
  }

  info(message: string, ...args: any[]): void {
    if (!environment.production || isDevMode()) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!environment.production || isDevMode()) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    // Los errores sí suelen dejarse en producción para trazabilidad en consola de cliente
    console.error(`[ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (!environment.production || isDevMode()) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}
