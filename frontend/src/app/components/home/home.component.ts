import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="home-container">
      <h1>Корпоративный сервис анкетирования</h1>
      <p>Создавайте, распространяйте и собирайте ответы по анкетам</p>
      
      <div class="home-actions">
        <button 
          class="home-btn" 
          (click)="goToLogin()"
          *ngIf="!authService.isAuthenticated()">
          Войти
        </button>
        <button 
          class="home-btn" 
          (click)="goToDashboard()"
          *ngIf="authService.isAuthenticated()">
          Личный кабинет
        </button>
        <button 
          class="home-btn" 
          (click)="goToSurveyList()">
          Посмотреть анкеты
        </button>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
      padding: 20px;
    }
    
    .home-actions {
      margin-top: 30px;
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .home-btn {
      padding: 12px 24px;
      font-size: 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background-color: #007bff;
      color: white;
      transition: background-color 0.3s;
    }
    
    .home-btn:hover {
      background-color: #0056b3;
    }
  `]
})
export class HomeComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToDashboard(): void {
    const user = this.authService.currentUser();
    if (user?.role === 'superadmin') {
      this.router.navigate(['/admin/users']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  goToSurveyList(): void {
    this.router.navigate(['/surveys']);
  }
}