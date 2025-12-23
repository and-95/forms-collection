import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User, ChangePasswordRequest } from '../../models/survey.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="profile-container">
      <div class="header">
        <h1>Профиль пользователя</h1>
        <p>Управление данными учетной записи</p>
      </div>
      
      <!-- Информация о пользователе -->
      <mat-card class="user-info-card">
        <mat-card-header>
          <mat-card-title>Информация о пользователе</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="user-info">
            <div class="info-row">
              <label>Логин:</label>
              <span>{{ user?.login }}</span>
            </div>
            <div class="info-row">
              <label>Роль:</label>
              <span>{{ user?.role === 'admin' ? 'Администратор' : 'Суперадминистратор' }}</span>
            </div>
            <div class="info-row">
              <label>Дата создания:</label>
              <span>{{ user?.createdAt | date:'dd.MM.yyyy HH:mm' }}</span>
            </div>
            <div class="info-row">
              <label>Дата последнего обновления:</label>
              <span>{{ user?.updatedAt | date:'dd.MM.yyyy HH:mm' }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Смена пароля -->
      <mat-card class="change-password-card">
        <mat-card-header>
          <mat-card-title>Смена пароля</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="password-form">
            <mat-form-field class="form-field">
              <mat-label>Текущий пароль</mat-label>
              <input 
                matInput 
                formControlName="currentPassword" 
                type="password"
                placeholder="Введите текущий пароль">
              <mat-error *ngIf="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched">
                {{ getCurrentPasswordErrorMessage() }}
              </mat-error>
            </mat-form-field>
            
            <mat-form-field class="form-field">
              <mat-label>Новый пароль</mat-label>
              <input 
                matInput 
                formControlName="newPassword" 
                type="password"
                placeholder="Введите новый пароль">
              <mat-error *ngIf="passwordForm.get('newPassword')?.invalid && passwordForm.get('newPassword')?.touched">
                {{ getNewPasswordErrorMessage() }}
              </mat-error>
            </mat-form-field>
            
            <mat-form-field class="form-field">
              <mat-label>Подтверждение нового пароля</mat-label>
              <input 
                matInput 
                formControlName="confirmNewPassword" 
                type="password"
                placeholder="Подтвердите новый пароль">
              <mat-error *ngIf="passwordForm.get('confirmNewPassword')?.invalid && passwordForm.get('confirmNewPassword')?.touched">
                Пароли не совпадают
              </mat-error>
            </mat-form-field>
            
            <div class="form-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="passwordForm.invalid">
                Сменить пароль
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .user-info-card, .change-password-card {
      margin-bottom: 20px;
    }
    
    .user-info {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    
    .info-row label {
      font-weight: bold;
      color: #666;
      width: 200px;
    }
    
    .info-row span {
      flex: 1;
      text-align: right;
    }
    
    .password-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .form-field {
      width: 100%;
    }
    
    .form-actions {
      text-align: right;
      margin-top: 10px;
    }
    
    @media (max-width: 768px) {
      .info-row {
        flex-direction: column;
        gap: 5px;
      }
      
      .info-row label {
        width: auto;
        text-align: left;
        font-weight: normal;
        color: #333;
      }
      
      .info-row span {
        text-align: left;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  passwordForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.passwordForm = this.createPasswordForm();
  }
  
  ngOnInit(): void {
    // Получаем информацию о текущем пользователе с сервера
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (error) => {
        console.error('Error loading user info', error);
        // Если не удалось загрузить с сервера, используем данные из локального хранилища
        this.user = this.authService.currentUser();
      }
    });
  }
  
  private createPasswordForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, this.passwordValidator]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }
  
  private passwordValidator(control: any) {
    if (!control.value) return null;
    
    const value = control.value;
    const hasMinLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*]/.test(value);
    
    const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    
    return isValid ? null : { passwordRequirements: true };
  }
  
  private passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword');
    const confirmNewPassword = formGroup.get('confirmNewPassword');
    
    if (!newPassword || !confirmNewPassword) return null;
    
    return newPassword.value === confirmNewPassword.value ? null : { passwordMismatch: true };
  }
  
  getCurrentPasswordErrorMessage(): string {
    const control = this.passwordForm.get('currentPassword');
    if (control?.errors?.['required']) {
      return 'Текущий пароль обязателен для заполнения';
    }
    return 'Некорректный пароль';
  }
  
  getNewPasswordErrorMessage(): string {
    const control = this.passwordForm.get('newPassword');
    if (control?.errors?.['required']) {
      return 'Новый пароль обязателен для заполнения';
    }
    if (control?.errors?.['passwordRequirements']) {
      return 'Пароль должен содержать не менее 8 символов, включая заглавные и строчные буквы, цифры и спецсимвол (!@#$%^&*)';
    }
    return 'Некорректный пароль';
  }
  
  changePassword(): void {
    if (this.passwordForm.valid) {
      const request: ChangePasswordRequest = {
        currentPassword: this.passwordForm.get('currentPassword')?.value,
        newPassword: this.passwordForm.get('newPassword')?.value
      };
      
      // В реальном приложении здесь будет вызов сервиса для смены пароля
      console.log('Changing password:', request);
      
      this.authService.changePassword(request).subscribe({
        next: (response) => {
          console.log('Password changed successfully');
          alert('Пароль успешно изменен');
          this.passwordForm.reset();
        },
        error: (error) => {
          console.error('Error changing password', error);
          alert('Ошибка при смене пароля: ' + (error.error?.message || 'Неизвестная ошибка'));
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }
  
  private markFormGroupTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      const control = this.passwordForm.get(key);
      control?.markAsTouched();
    });
  }
}