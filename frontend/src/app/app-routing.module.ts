import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './shared/layouts/private-layout/private-layout.component';
import { AuthGuard } from './core/guards/auth.guard';

import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './domain/enums/role.enum';
import { UserActiveGuard } from './core/guards/user-active.guard';
import { AccesoDenegadoPage } from './features/usuario/acceso-denegado/acceso-denegado.page';
import { AccesoRestringidoPage } from './features/usuario/acceso-restringido/acceso-restringido.page';

const routes: Routes = [
    {
        path: '',
        component: PrivateLayoutComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [UserRole.SUPERADMIN] },
        loadChildren: () => import('./features/main/main.module').then(m => m.MainModule)
    },
    {
        path: 'auth',
        component: PublicLayoutComponent,
        loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
    },
    {
        path: 'acceso-denegado',
        component: AccesoDenegadoPage
    },
    {
        path: 'acceso-restringido',
        component: AccesoRestringidoPage
    },
    {
        path: 'vendedor',
        component: PrivateLayoutComponent,
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [UserRole.VENDEDOR] },
        loadChildren: () => import('./features/vendedor/vendedor.module').then(m => m.VendedorModule)
    },
    {
        path: 'usuario',
        component: PrivateLayoutComponent,
        canActivate: [AuthGuard, RoleGuard, UserActiveGuard],
        data: { roles: [UserRole.USUARIO] },
        loadChildren: () => import('./features/usuario/usuario.module').then(m => m.UsuarioModule)
    },
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
        preloadingStrategy: PreloadAllModules
    })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
