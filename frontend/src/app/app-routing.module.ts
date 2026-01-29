import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './shared/layouts/private-layout/private-layout.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
    {
        path: '',
        component: PrivateLayoutComponent,
        canActivate: [AuthGuard],
        loadChildren: () => import('./features/main/main.module').then(m => m.MainModule)
    },
    {
        path: 'auth',
        component: PublicLayoutComponent,
        loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
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
