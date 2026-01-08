import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { StatCardComponent } from '../../components/widgets/stat-card/stat-card.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { SuperadminDashboardComponent } from '../../components/superadmin-dashboard/superadmin-dashboard.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, SidebarComponent, HeaderComponent, StatCardComponent, SuperadminDashboardComponent],
  template: `
    @if (auth.isSuperadmin()) {
        <app-superadmin-dashboard></app-superadmin-dashboard>
    } @else {
        <!-- Generic/Vendedor/Usuario Dashboard Fallback -->
        <div class="d-flex min-vh-100 bg-light" style="font-family: system-ui, sans-serif;">
        <app-sidebar></app-sidebar>
        
        <div class="flex-grow-1 d-flex flex-column h-100" style="overflow-y: auto;">
            <app-header></app-header>
            
            <div class="p-4">
            <div class="row g-4 mb-4">
                <!-- Row 1 -->
                <div class="col-12 col-md-6 col-lg-3">
                <app-stat-card 
                    icon="📑" 
                    title="Total Sales" 
                    value="$612.917" 
                    trend="+2.08%" 
                    subtext="Products vs last month"
                    [fullColor]="true"
                ></app-stat-card>
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                <app-stat-card 
                    icon="📦" 
                    title="Total Orders" 
                    value="34.760" 
                    trend="+12.4%" 
                    subtext="Orders vs last month"
                ></app-stat-card>
                </div>
                <!-- Placeholder for Chart 1 -->
                <div class="col-12 col-lg-6">
                <div class="card border-0 rounded-4 p-4 h-100 shadow-sm">
                    <h3 class="h5 mb-4">Product Statistic</h3>
                    <div class="d-flex justify-content-center align-items-center h-100 text-secondary">
                    [Chart Placeholder: Circular Graph]
                    </div>
                </div>
                </div>
            </div>

            <div class="row g-4">
                <!-- Row 2 -->
                <div class="col-12 col-md-6 col-lg-3">
                <app-stat-card 
                    icon="👥" 
                    title="Visitor" 
                    value="14.987" 
                    trend="-2.08%" 
                    subtext="Users vs last month"
                ></app-stat-card>
                </div>
                <div class="col-12 col-md-6 col-lg-3">
                <app-stat-card 
                    icon="🚚" 
                    title="Total Sold Products" 
                    value="12.987" 
                    trend="+12.1%" 
                    subtext="Products vs last month"
                ></app-stat-card>
                </div>
                <!-- Placeholder for Chart 2 -->
                <div class="col-12 col-lg-6">
                    <div class="card border-0 rounded-4 p-4 h-100 shadow-sm">
                    <h3 class="h5 mb-4">Customer Habits</h3>
                    <div class="d-flex justify-content-center align-items-center h-100 text-secondary">
                        [Chart Placeholder: Bar Graph]
                    </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    }
  `,
  styles: []
})
export class DashboardPageComponent {
  auth = inject(AuthService);
}
