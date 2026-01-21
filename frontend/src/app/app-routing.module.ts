import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './shared/layouts/private-layout/private-layout.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
    {
        path: 'dashboard',
        component: PrivateLayoutComponent,
        canActivate: [AuthGuard],
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
    },
    {
        path: '',
        component: PublicLayoutComponent,
        loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
    },
    { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
        preloadingStrategy: PreloadAllModules
    })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
