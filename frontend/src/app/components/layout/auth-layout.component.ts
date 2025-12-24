import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [SidebarComponent, RouterOutlet, NgIf],
  template: `
    <div class="layout-container">
      <app-sidebar *ngIf="authService.isAuthenticated()" />
      <main class="main-content" [class.with-sidebar]="authService.isAuthenticated()">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
    }
    
    .main-content {
      flex: 1;
      padding: 1rem;
      transition: margin-left 0.3s ease;
    }
    
    .main-content.with-sidebar {
      margin-left: 250px;
    }
  `]
})
export class AuthLayoutComponent {
  authService = inject(AuthService);
}