import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { PrivateLayoutComponent } from './layouts/private-layout/private-layout.component';
import { ToastComponent } from './components/toast/toast.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { ChartCardComponent } from './components/chart-card/chart-card.component';
import { HorizontalBarCardComponent } from './components/horizontal-bar-card/horizontal-bar-card.component';
import { WelcomeCardComponent } from './components/welcome-card/welcome-card.component';
import { MaintenanceComponent } from './components/maintenance/maintenance.component';
import { PremiumAlertComponent } from './components/premium-alert/premium-alert.component';
import { HasPermissionDirective } from './directives/has-permission.directive';

@NgModule({
    declarations: [
        NavbarComponent,
        SidebarComponent,
        PublicLayoutComponent,
        PrivateLayoutComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        FormsModule,
        ToastComponent,
        StatCardComponent,
        ChartCardComponent,
        HorizontalBarCardComponent,
        WelcomeCardComponent,
        MaintenanceComponent,
        PremiumAlertComponent,
        HasPermissionDirective
    ],
    exports: [
        CommonModule,
        RouterModule,
        ReactiveFormsModule,
        FormsModule,
        NavbarComponent,
        SidebarComponent,
        PublicLayoutComponent,
        PrivateLayoutComponent,
        ToastComponent,
        StatCardComponent,
        ChartCardComponent,
        HorizontalBarCardComponent,
        WelcomeCardComponent,
        MaintenanceComponent,
        PremiumAlertComponent,
        HasPermissionDirective
    ]
})
export class SharedModule { }
