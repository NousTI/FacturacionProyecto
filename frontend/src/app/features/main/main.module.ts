import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainRoutingModule } from './main-routing.module';
import { DashboardHomePage } from '../super-admin/home/dashboard-home.page';
import { WelcomeCardComponent } from '../../shared/components/welcome-card/welcome-card.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [
        CommonModule,
        MainRoutingModule,
        SharedModule,
        DashboardHomePage,
        WelcomeCardComponent
    ]
})
export class MainModule { }
