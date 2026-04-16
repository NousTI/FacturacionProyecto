import { Injectable, computed, signal, effect } from '@angular/core';
import { AuthFacade } from './auth.facade';
import { AuthService } from './auth.service';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/enums/role.enum';
import { Permiso } from '../../domain/models/perfil.model';

@Injectable({
    providedIn: 'root'
})
export class PermissionsService {
    // Signal que se actualiza cuando el usuario en localStorage cambia
    private userSignal = signal<User | null>(null);

    constructor(
        private authService: AuthService,
        private authFacade: AuthFacade
    ) {
        // Inicializar signal con el usuario actual
        const currentUser = this.authService.getUser();
        this.userSignal.set(currentUser);

        // Observar cambios en el usuario desde AuthFacade y actualizar el signal
        this.authFacade.user$.subscribe(user => {
            this.userSignal.set(user);
        });
    }

    hasPermission(permission: string | string[]): boolean {
        const user = this.userSignal();
        if (!user) {
            return false;
        }

        // 1. SuperAdmin bypass
        if (user.role === UserRole.SUPERADMIN || (user as any).is_superadmin) {
            return true;
        }

        // 2. Company Admin bypass (rol_codigo: ADMIN, ADMIN_TOTAL, etc)
        const rolCodigo = (user.rol_codigo || '').toUpperCase();
        if (rolCodigo === 'ADMIN' || rolCodigo.startsWith('ADMIN_')) {
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

    // Nuevo método reactive que retorna un signal
    hasPermissionSignal(permission: string | string[]) {
        return computed(() => {
            return this.hasPermission(permission);
        });
    }

    get isAdminEmpresa(): boolean {
        const user = this.userSignal();
        if (!user) return false;

        // 1. SuperAdmin siempre tiene rango de admin de empresa
        if (user.role === UserRole.SUPERADMIN || (user as any).is_superadmin) {
            return true;
        }

        // 2. Check flexible de rol_codigo para administradores de empresa
        const rolCodigo = (user.rol_codigo || '').toUpperCase();
        return rolCodigo === 'ADMIN' || rolCodigo.startsWith('ADMIN_');
    }
}
