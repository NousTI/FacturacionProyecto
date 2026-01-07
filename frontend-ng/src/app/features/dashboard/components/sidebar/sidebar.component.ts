import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="sidebar d-flex flex-column p-4 h-100 bg-white border-end">
      <!-- Logo -->
      <div class="d-flex align-items-center gap-2 mb-4 fw-bold text-dark fs-5">
        <div class="logo-icon d-flex align-items-center justify-content-center text-white bg-dark rounded">D</div>
        DealDeck
      </div>

      <!-- Menus -->
      <div class="d-flex flex-column gap-4 flex-grow-1">
        <div class="menu-section">
          <div class="menu-title text-uppercase text-secondary fw-bold mb-2">Menu</div>
          <div class="menu-item active">
            <i class="bi bi-grid-fill"></i> Dashboard
          </div>
          <div class="menu-item">
            <i class="bi bi-file-earmark-text"></i> Report
          </div>
          <div class="menu-item">
            <i class="bi bi-box-seam"></i> Products
          </div>
          <div class="menu-item">
            <i class="bi bi-person"></i> Consumer
          </div>
        </div>

        <div class="menu-section">
          <div class="menu-title text-uppercase text-secondary fw-bold mb-2">Financial</div>
          <div class="menu-item">
            <i class="bi bi-cash-stack"></i> Transactions
          </div>
          <div class="menu-item">
            <i class="bi bi-receipt"></i> Invoices
          </div>
        </div>

        <div class="menu-section">
          <div class="menu-title text-uppercase text-secondary fw-bold mb-2">Tools</div>
          <div class="menu-item">
            <i class="bi bi-gear"></i> Settings
          </div>
          <div class="menu-item">
            <i class="bi bi-chat-dots"></i> Feedback
          </div>
          <div class="menu-item">
            <i class="bi bi-question-circle"></i> Help
          </div>
        </div>
      </div>

      <!-- Upgrade Badge -->
      <div class="upgrade-card bg-dark text-white p-3 rounded-4 mt-auto">
        <div class="upgrade-icon bg-white bg-opacity-25 rounded p-1 mb-2 d-inline-flex">
          ⚡
        </div>
        <h6 class="mb-1">Upgrade Pro</h6>
        <p class="small text-secondary mb-2">Get full access to all features</p>
        <button class="btn btn-primary w-100 btn-sm fw-bold">Upgrade $30</button>
      </div>
    </div>
  `,
    styles: [`
    .logo-icon { width: 32px; height: 32px; }
    .menu-title { font-size: 0.75rem; letter-spacing: 0.05em; }
    .menu-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem; border-radius: 8px;
      color: #4b5563; cursor: pointer; transition: all 0.2s;
    }
    .menu-item:hover { background-color: #f3f4f6; }
    .menu-item.active { background-color: #4f46e5; color: white; font-weight: 500; }
    .upgrade-card button { background-color: #4f46e5; border: none; }
  `]
})
export class SidebarComponent { }
