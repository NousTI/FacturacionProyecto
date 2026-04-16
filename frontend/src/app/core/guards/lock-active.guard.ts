import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LockStatusService } from '../services/lock-status.service';
import { UserRole } from '../../domain/enums/role.enum';
import { take, map } from 'rxjs';

export const lockActiveGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const lockStatusService = inject(LockStatusService);
    const router = inject(Router);

    const user = authService.getUser();

    // Si no hay usuario autenticado, redirigir a login
    if (!user) {
        return router.createUrlTree(['/auth/login']);
    }

    // Si el usuario no es USUARIO, no tiene sentido estar en acceso-restringido
    if (user.role !== UserRole.USUARIO) {
        return router.createUrlTree(['/auth/login']);
    }

    // Verificar si hay un lock activo en el servicio o si el usuario realmente está bloqueado
    return lockStatusService.lock$.pipe(
        take(1),
        map(lock => {
            if (lock) return true;

            // Verificar directamente en el estado del usuario
            const isEmpresaInactiva = user.empresa_activa === false;
            const estado = user.empresa_suscripcion_estado;
            const isSuscripcionBloqueada = estado === 'CANCELADA' || estado === 'SUSPENDIDA';

            if (isEmpresaInactiva || isSuscripcionBloqueada) return true;

            // No hay razón para estar en acceso-restringido, redirigir a login
            return router.createUrlTree(['/auth/login']);
        })
    );
};
