import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/auth/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'perfil',
        pathMatch: 'full'
    },
    {
        path: 'login',
        canActivate: [publicGuard],
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () => import('./features/auth/profile/profile.component').then(m => m.ProfileComponent)
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(m => m.DashboardPageComponent)
    },
    {
        path: '**',
        redirectTo: 'perfil'
    }
];
