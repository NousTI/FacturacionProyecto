import { Component } from '@angular/core';

@Component({
  selector: 'app-public-layout',
  template: `
    <div class="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [],
  standalone: false
})
export class PublicLayoutComponent { }
