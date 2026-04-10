import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { VendedorPerfilService } from '../perfil/services/perfil-vendedor.service';

@Injectable({
  providedIn: 'root'
})
export class VendedorActivoGuard implements CanActivate, CanActivateChild {
  constructor(
    private perfilService: VendedorPerfilService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.verificarActividad();
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.verificarActividad();
  }

  private verificarActividad(): Observable<boolean> {
    return this.perfilService.obtenerPerfil().pipe(
      tap((perfil) => {
        if (!perfil.activo) {
          this.router.navigate(['/vendedor/bloqueado']);
        }
      }),
      map((perfil) => perfil.activo),
      catchError((error) => {
        // En caso de error (401, 404, etc), dejar pasar
        // El auth guard lo manejará si es autenticación
        console.error('[VendedorActivoGuard] Error al verificar actividad:', error);
        return of(true);
      })
    );
  }
}
