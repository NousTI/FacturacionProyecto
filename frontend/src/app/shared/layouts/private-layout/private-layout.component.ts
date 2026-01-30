import { Component } from '@angular/core';

@Component({
  selector: 'app-private-layout',
  template: `
    <div class="dashboard-wrapper">
      <app-sidebar class="sidebar-container"></app-sidebar>
      <div class="main-content">
        <app-navbar></app-navbar>
        <div class="content-body">
          <router-outlet></router-outlet>
        </div>
      </div>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      display: flex;
      height: 100vh;
      background-color: #f8f9fe;
      overflow: hidden;
    }
    .sidebar-container {
      width: 280px;
      flex-shrink: 0;
      background: white;
      border-right: 1px solid rgba(0,0,0,0.05);
    }
    .main-content {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .content-body {
      padding: 24px;
      flex-grow: 1;
      overflow-y: auto;
      background-color: #f8fafc;
      display: flex;
      flex-direction: column;
    }
  `],
  standalone: false
})
export class PrivateLayoutComponent { }
