import { Injectable, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/enums/role.enum';

@Injectable({
    providedIn: 'root'
})
export class PermissionsService {

    constructor(private authService: AuthService) { }

    hasPermission(permission: string): boolean {
        const user = this.authService.getUser();
        if (!user) return false;

        // SuperAdmin tiene acceso a todo
        if (user.role === UserRole.SUPERADMIN || (user as any).is_superadmin) {
            return true;
        }

        // Mapeo de strings a propiedades del modelo User
        // 'crear_empresas' -> user.puede_crear_empresas
        return !!(user as any)[permission] || !!(user as any)[`puede_${permission}`];
    }
}
