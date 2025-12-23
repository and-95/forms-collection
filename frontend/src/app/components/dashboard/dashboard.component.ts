import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule
  ],
  template: `
    <div class="dashboard-container">
      <div class="header">
        <h1>Личный кабинет</h1>
        <p>Управление анкетами и пользователями</p>
      </div>
      
      <div class="dashboard-content">
        <div class="quick-actions">
          <mat-card class="action-card" *ngIf="authService.hasAnyRole(['admin', 'superadmin'])">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>description</mat-icon>
                <span>Анкеты</span>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Создавайте и управляйте анкетами, просматривайте ответы и статистику</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" routerLink="/surveys">Перейти к анкетам</button>
            </mat-card-actions>
          </mat-card>
          
          <mat-card class="action-card" *ngIf="authService.hasRole('superadmin')">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>people</mat-icon>
                <span>Пользователи</span>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Управляйте учетными записями администраторов</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" routerLink="/admin/users">Управление пользователями</button>
            </mat-card-actions>
          </mat-card>
          
          <mat-card class="action-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person</mat-icon>
                <span>Профиль</span>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Измените настройки профиля и смените пароль</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" routerLink="/profile">Управление профилем</button>
            </mat-card-actions>
          </mat-card>
        </div>
        
        <div class="stats-overview" *ngIf="authService.hasAnyRole(['admin', 'superadmin'])">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Статистика</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stats-grid">
                <div class="stat-item">
                  <mat-icon color="primary">description</mat-icon>
                  <div class="stat-value">5</div>
                  <div class="stat-label">Анкет</div>
                </div>
                <div class="stat-item">
                  <mat-icon color="accent">data_usage</mat-icon>
                  <div class="stat-value">127</div>
                  <div class="stat-label">Ответов</div>
                </div>
                <div class="stat-item">
                  <mat-icon color="warn">schedule</mat-icon>
                  <div class="stat-value">3</div>
                  <div class="stat-label">Активных</div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .dashboard-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .action-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .action-card mat-card-header {
      display: flex;
      align-items: center;
    }
    
    .action-card mat-card-header mat-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .action-card mat-card-content {
      flex: 1;
    }
    
    .stats-overview {
      margin-top: 20px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
    }
    
    .stat-item {
      text-align: center;
      padding: 15px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .quick-actions {
        grid-template-columns: 1fr;
      }
      
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {

  constructor(public authService: AuthService) { }

  ngOnInit(): void {
  }

}