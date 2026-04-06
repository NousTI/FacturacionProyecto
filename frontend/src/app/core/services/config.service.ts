import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly config = environment;

  constructor() {
    this.validateConfig();
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get isProduction(): boolean {
    return this.config.production;
  }

  private validateConfig(): void {
    const criticalKeys: (keyof typeof environment)[] = ['apiUrl'];
    
    const missingKeys = criticalKeys.filter(key => !this.config[key]);
    
    if (missingKeys.length > 0) {
      const errorMsg = `[CRITICAL CONFIG ERROR] Missing environment variables: ${missingKeys.join(', ')}`;
      console.error(errorMsg);
      // En una app real, podríamos redirigir a una página de error crítico
      if (this.config.production) {
        throw new Error('Application configuration is invalid.');
      }
    }
  }
}
