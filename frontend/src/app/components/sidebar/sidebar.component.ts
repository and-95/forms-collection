import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  route: string;
  roles: ('admin' | 'superadmin')[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgFor, NgIf],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3>Меню</h3>
      </div>
      <nav class="sidebar-nav">
        <ul>
          <li *ngFor="let item of getNavItems()">
            <a 
              [routerLink]="item.route" 
              routerLinkActive="active"
              class="nav-link"
              [class.hidden]="!hasRole(item.roles)">
              {{ item.label }}
            </a>
          </li>
        </ul>
      </nav>
      <div class="sidebar-footer">
        <button class="logout-btn" (click)="logout()">Выйти</button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      background-color: #f8f9fa;
      border-right: 1px solid #dee2e6;
      display: flex;
      flex-direction: column;
      z-index: 1000;
    }
    
    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid #dee2e6;
    }
    
    .sidebar-header h3 {
      margin: 0;
      font-size: 1.25rem;
    }
    
    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 0;
    }
    
    .sidebar-nav ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .sidebar-nav li {
      padding: 0;
    }
    
    .nav-link {
      display: block;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: #495057;
      transition: background-color 0.2s;
    }
    
    .nav-link:hover {
      background-color: #e9ecef;
    }
    
    .nav-link.active {
      background-color: #007bff;
      color: white;
    }
    
    .nav-link.hidden {
      display: none;
    }
    
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #dee2e6;
    }
    
    .logout-btn {
      width: 100%;
      padding: 0.5rem;
      background-color: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .logout-btn:hover {
      background-color: #c82333;
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  navItems: NavItem[] = [
    { label: 'Создать опрос', route: '/surveys/create', roles: ['admin', 'superadmin'] },
    { label: 'Список опросов', route: '/surveys', roles: ['admin', 'superadmin'] },
    { label: 'Профиль', route: '/profile', roles: ['admin', 'superadmin'] },
    { label: 'Управление пользователями', route: '/admin/users', roles: ['superadmin'] },
    { label: 'Дашборд', route: '/dashboard', roles: ['admin', 'superadmin'] }
  ];

  getNavItems(): NavItem[] {
    return this.navItems;
  }

  hasRole(allowedRoles: ('admin' | 'superadmin')[]): boolean {
    const user = this.authService.currentUser();
    return user ? allowedRoles.includes(user.role) : false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}