import { Injectable, computed, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/enums/role.enum';
import { Permiso } from '../../domain/models/perfil.model';

@Injectable({
    providedIn: 'root'
})
export class PermissionsService {

    constructor(private authService: AuthService) { }

    hasPermission(permission: string | string[]): boolean {
        const user = this.authService.getUser();
        if (!user) {
            return false;
        }

        // 1. SuperAdmin bypass
        if (user.role === UserRole.SUPERADMIN || (user as any).is_superadmin) {
            return true;
        }

        const permissionsToCheck = Array.isArray(permission) ? permission : [permission];

        return permissionsToCheck.some(p => {
            // 2. Check granular permissions (New System)
            if (user.permisos && user.permisos.length > 0) {
                const first = user.permisos[0];

                // Case A: string array (codes from token)
                if (typeof first === 'string') {
                    if ((user.permisos as string[]).includes(p)) return true;
                }
                // Case B: Permiso object array (detailed from profile)
                else {
                    const perms = user.permisos as Permiso[];
                    const found = perms.find(perm => perm.codigo === p);
                    if (found && found.concedido) return true;
                }
            }

            // 3. Backward compatibility/Legacy/Vendor flags
            return !!(user as any)[p] || !!(user as any)[`puede_${p}`];
        });
    }
}
