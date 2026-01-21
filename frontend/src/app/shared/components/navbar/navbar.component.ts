import { Component, OnInit } from '@angular/core';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { Observable, filter, map, mergeMap } from 'rxjs';
import { User } from '../../../domain/models/user.model';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar navbar-expand-lg px-4 py-3 bg-white border-bottom shadow-sm">
      <div class="container-fluid p-0">
        <!-- Page Header Info -->
        <div class="page-header-info d-none d-lg-block me-auto">
          <h5 class="fw-bold mb-0 text-dark">{{ pageTitle }}</h5>
          <div class="d-flex align-items-center">
            <span class="text-muted small me-3">{{ pageDescription }}</span>
            <span class="text-primary small fw-medium">
              <i class="bi bi-calendar3 me-1"></i> {{ today | date:'dd MMMM, yyyy' }}
            </span>
          </div>
        </div>

        <div class="search-container d-none d-md-flex ms-auto me-3">
          <i class="bi bi-search me-2 text-muted"></i>
          <input type="text" class="form-control border-0 bg-transparent shadow-none" placeholder="Buscar...">
        </div>

        <div class="d-flex align-items-center">
          <button class="btn btn-icon me-3">
            <i class="bi bi-bell"></i>
          </button>
          
          <div class="user-profile d-flex align-items-center" *ngIf="user$ | async as user" [attr.data-bs-toggle]="'dropdown'">
            <div class="avatar-circle me-3 shadow-sm">
              {{ (user.nombres?.charAt(0) || 'U') | uppercase }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ user.nombres }} {{ user.apellidos }}</span>
              <span class="user-role">{{ user.role }}</span>
            </div>
          </div>

          <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2">
            <li><a class="dropdown-item py-2 px-3" routerLink="/dashboard/perfil"><i class="bi bi-person me-2"></i> Perfil</a></li>
            <li><hr class="dropdown-divider mx-3"></li>
            <li><button class="dropdown-item py-2 px-3 text-danger" (click)="logout()"><i class="bi bi-box-arrow-right me-2"></i> Cerrar Sesión</button></li>
          </ul>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      height: 80px;
    }
    .page-header-info h5 {
      font-size: 1.1rem;
      letter-spacing: -0.5px;
    }
    .search-container {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 0 16px;
      width: 250px;
      border: 1px solid rgba(0,0,0,0.02);
      align-items: center;
    }
    .btn-icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #f1f5f9;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }
    .avatar-circle {
      width: 40px;
      height: 40px;
      background: var(--primary-gradient, #4facfe);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      cursor: pointer;
      font-size: 1.1rem;
    }
    .user-profile {
      cursor: pointer;
      padding: 4px;
      border-radius: 12px;
      transition: background 0.2s;
    }
    .user-profile:hover {
      background: rgba(0,0,0,0.02);
    }
    .user-name {
      display: block;
      font-weight: 700;
      color: #0f172a;
      font-size: 0.85rem;
      line-height: 1.2;
    }
    .user-role {
      display: block;
      color: #64748b;
      font-size: 0.7rem;
      font-weight: 500;
      line-height: 1.2;
      margin-top: 2px;
      text-transform: lowercase;
    }
    .user-role::first-letter {
      text-transform: uppercase;
    }
  `],
  standalone: false
})
export class NavbarComponent implements OnInit {
  user$: Observable<User | null>;
  pageTitle: string = 'Dashboard';
  pageDescription: string = 'Bienvenido al sistema';
  today = new Date();

  constructor(
    private authFacade: AuthFacade,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    this.user$ = this.authFacade.user$;
  }

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      mergeMap(route => route.data)
    ).subscribe(data => {
      this.pageTitle = data['title'] || 'Dashboard';
      this.pageDescription = data['description'] || 'Bienvenido al sistema';
    });

    // Initial load
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    route.data.subscribe(data => {
      this.pageTitle = data['title'] || 'Dashboard';
      this.pageDescription = data['description'] || 'Bienvenido al sistema';
    });
  }

  logout() {
    this.authFacade.logout();
  }
}
