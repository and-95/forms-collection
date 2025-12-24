import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  template: `
    <div class="login-container">
      <div class="login-form">
        <h2>Вход в систему</h2>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="login">Логин</label>
            <input 
              type="text" 
              id="login" 
              formControlName="login" 
              class="form-control"
              [class.error]="loginForm.get('login')?.invalid && loginForm.get('login')?.touched">
          </div>
          
          <div class="form-group">
            <label for="password">Пароль</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-control"
              [class.error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
          </div>
          
          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
          
          <button 
            type="submit" 
            class="submit-btn"
            [disabled]="loginForm.invalid || loading()">
            <span *ngIf="!loading()">Войти</span>
            <span *ngIf="loading()">Вход...</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    
    .login-form {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
    }
    
    .form-control.error {
      border-color: #dc3545;
    }
    
    .error-message {
      color: #dc3545;
      margin: 0.5rem 0;
      text-align: center;
    }
    
    .submit-btn {
      width: 100%;
      padding: 0.75rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .submit-btn:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
    
    .submit-btn:not(:disabled):hover {
      background-color: #0056b3;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      login: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading.set(true);
      this.errorMessage = '';
      
      const { login, password } = this.loginForm.value;
      
      this.authService.login(login, password).subscribe({
        next: (response) => {
          this.loading.set(false);
          // User data is already set in the auth service after successful login
          // The user is already authenticated at this point
          
          if (response.user?.role === 'superadmin') {
            this.router.navigate(['/admin/users']);
          } else {
            this.router.navigate(['/dashboard']); // Redirect to dashboard as the main page after login
          }
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage = error.error?.message || 'Ошибка входа. Проверьте логин и пароль.';
        }
      });
    } else {
      // Отмечаем поля как touched для отображения ошибок
      this.loginForm.markAllAsTouched();
    }
  }
}