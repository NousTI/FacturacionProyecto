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
        if (!user) {
            console.warn('PermissionsService: No user found in session');
            return false;
        }

        // 1. SuperAdmin bypass
        if (user.role === UserRole.SUPERADMIN || (user as any).is_superadmin) {
            return true;
        }

        // 2. Check granular permissions array (New System)
        const hasGranular = user.permisos && user.permisos.includes(permission);
        if (hasGranular) return true;

        // 3. Backward compatibility/Legacy
        const hasLegacy = !!(user as any)[permission] || !!(user as any)[`puede_${permission}`];

        if (!hasGranular && !hasLegacy && (permission.includes('EDITAR') || permission.includes('ELIMINAR'))) {
            console.log(`Permission Denied for ${permission}. User perms:`, user.permisos);
        }

        return hasLegacy;
    }
}
