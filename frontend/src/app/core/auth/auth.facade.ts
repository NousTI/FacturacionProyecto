import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, finalize } from 'rxjs';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/enums/role.enum';
import { Router } from '@angular/router';
import { UiService } from '../../shared/services/ui.service';
import { LockStatusService } from '../services/lock-status.service';
import { getFirstAccessibleModule } from '../../constants/module-permissions';

import { ROLES } from '../../../shared/constantes/app.constants';

@Injectable({
    providedIn: 'root'
})
export class AuthFacade {
    private userSubject: BehaviorSubject<User | null>;
    public user$: Observable<User | null>;

    private isAuthenticatedSubject: BehaviorSubject<boolean>;
    public isAuthenticated$: Observable<boolean>;

    constructor(
        private authService: AuthService,
        private router: Router,
        private uiService: UiService,
        private lockService: LockStatusService
    ) {
        const currentUser = this.authService.getUser();
        this.userSubject = new BehaviorSubject<User | null>(currentUser);
        this.user$ = this.userSubject.asObservable();
        this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.authService.isAuthenticated());
        this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

        // Si hay usuario pero le faltan datos estratégicos (como rol_codigo), refrescamos automáticamente
        if (currentUser && !currentUser.is_superadmin && !currentUser.rol_codigo) {
            console.log('[AuthFacade] Datos incompletos detectados, refrescando perfil...');
            this.recargarPermisos().subscribe();
        }
    }

    login(correo: string, clave: string): Observable<any> {
        return new Observable(observer => {
            this.authService.login(correo, clave).subscribe({
                next: (response) => {
                    this.isAuthenticatedSubject.next(true);

                    const userWithRole = response.usuario;
                    const role = (userWithRole.role || this.authService.getRole()) as UserRole;

                    // Asegurar que los permisos esté disponibles con el usuario
                    const userWithPermissions = { ...userWithRole, role };

                    // Notificar primero (para que PermissionsService se suscriba)
                    this.userSubject.next(userWithPermissions);

                    // Bloqueo Proactivo al iniciar sesión
                    if (userWithRole.empresa_lock) {
                        this.lockService.setLock(userWithRole.empresa_lock.type as any, {
                            phone: userWithRole.empresa_lock.phone,
                            message: userWithRole.empresa_lock.message
                        });
                    }

                    observer.next(response);
                    observer.complete();

                    // Navegar DESPUÉS de que el observer se complete
                    this.navigateBasedOnRole(role);
                },
                error: (err) => {
                    observer.error(err);
                }
            });
        });
    }

    logout(): Observable<void> {
        return this.authService.logout().pipe(
            tap(() => {
                this.userSubject.next(null);
                this.isAuthenticatedSubject.next(false);
                this.uiService.showToast('Has cerrado sesión correctamente', 'info');
            }),
            tap({
                error: () => {
                    // Even on error, clear local state
                    this.userSubject.next(null);
                    this.isAuthenticatedSubject.next(false);
                }
            }),
            finalize(() => {
                // Force a full page reload to clear all in-memory caches and singleton states
                window.location.href = '/auth/login';
            })
        );
    }

    getUserRole(): UserRole | null {
        return this.authService.getRole();
    }

    getUser(): User | null {
        return this.authService.getUser();
    }

    // Recargar permisos desde el backend (útil cuando se asignan/desasignan permisos)
    recargarPermisos(): Observable<User | null> {
        return new Observable(observer => {
            this.authService.recargarPermisos().subscribe({
                next: (user) => {
                    const currentUser = this.authService.getUser();
                    if (currentUser) {
                        this.userSubject.next(currentUser);
                        observer.next(currentUser);
                    }
                    observer.complete();
                },
                error: (err) => {
                    observer.error(err);
                }
            });
        });
    }

    hasPermission(permission: string | string[]): boolean {
        const user = this.getUser();
        if (!user) return false;

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
                    const perms = user.permisos as any[];
                    const found = perms.find(perm => perm.codigo === p);
                    if (found && found.concedido) return true;
                }
            }

            // 3. Backward compatibility/Legacy/Vendor flags
            return !!(user as any)[p] || !!(user as any)[`puede_${p}`];
        });
    }

    private navigateBasedOnRole(role: string | null): void {
        // Lógica de redirección dinámica basada en el rol inyectado
        console.log(`[navigateBasedOnRole] Rol recibido: ${role}`);
        if (role === UserRole.SUPERADMIN) {
            console.log('[navigateBasedOnRole] Navegando a /');
            this.router.navigate(['/']);
        } else if (role === UserRole.VENDEDOR) {
            console.log('[navigateBasedOnRole] Navegando a /vendedor');
            this.router.navigate(['/vendedor']);
        } else if (role === UserRole.USUARIO) {
            // Usuario regular: buscar el primer módulo al que tenga acceso
            const user = this.authService.getUser();
            const permisos = (user?.permisos || []) as any[];

            // Normalizar permisos a strings
            const permisoCodes = permisos.map(p =>
              typeof p === 'string' ? p : p.codigo
            );

            const firstModule = getFirstAccessibleModule(permisoCodes);
            if (firstModule) {
                console.log(`[navigateBasedOnRole] Navegando a ${firstModule.path}`);
                this.router.navigate([firstModule.path]);
            } else {
                console.log('[navigateBasedOnRole] Usuario sin permisos, navegando a /usuario/sin-permisos');
                this.router.navigate(['/usuario/sin-permisos']);
            }
        }
    }
}
