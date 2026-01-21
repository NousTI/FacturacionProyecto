import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardHomePage } from './pages/home/dashboard-home.page';
import { WelcomeCardComponent } from './components/welcome-card/welcome-card.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [
        CommonModule,
        DashboardRoutingModule,
        SharedModule,
        DashboardHomePage,
        WelcomeCardComponent
    ]
})
export class DashboardModule { }
