import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { SurveyService } from '../../services/survey.service';
import { User } from '../../models/survey.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="user-management-container">
      <div class="header">
        <h1>Управление пользователями</h1>
        <p>Создание и управление учетными записями администраторов</p>
      </div>
      
      <!-- Форма создания пользователя -->
      <mat-card class="user-form-card" *ngIf="authService.hasRole('superadmin')">
        <mat-card-header>
          <mat-card-title>Создать нового пользователя</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="userForm" (ngSubmit)="createUser()" class="user-form">
            <div class="form-row">
              <mat-form-field class="form-field">
                <mat-label>Логин</mat-label>
                <input matInput formControlName="login" placeholder="Введите логин">
                <mat-error *ngIf="userForm.get('login')?.invalid && userForm.get('login')?.touched">
                  {{ getLoginErrorMessage() }}
                </mat-error>
              </mat-form-field>
              
              <mat-form-field class="form-field">
                <mat-label>Роль</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="admin">Администратор</mat-option>
                  <mat-option value="superadmin">Суперадминистратор</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field class="form-field">
                <mat-label>Временный пароль</mat-label>
                <input 
                  matInput 
                  formControlName="password" 
                  type="password"
                  placeholder="Введите временный пароль">
                <mat-error *ngIf="userForm.get('password')?.invalid && userForm.get('password')?.touched">
                  {{ getPasswordErrorMessage() }}
                </mat-error>
              </mat-form-field>
              
              <mat-form-field class="form-field">
                <mat-label>Подтверждение пароля</mat-label>
                <input 
                  matInput 
                  formControlName="confirmPassword" 
                  type="password"
                  placeholder="Подтвердите пароль">
                <mat-error *ngIf="userForm.get('confirmPassword')?.invalid && userForm.get('confirmPassword')?.touched">
                  Пароли не совпадают
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="userForm.invalid">
                Создать пользователя
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      
      <!-- Список пользователей -->
      <mat-card class="users-list-card">
        <mat-card-header>
          <mat-card-title>Список пользователей</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="users" class="users-table">
              <ng-container matColumnDef="login">
                <th mat-header-cell *matHeaderCellDef>Логин</th>
                <td mat-cell *matCellDef="let user">{{ user.login }}</td>
              </ng-container>
              
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Роль</th>
                <td mat-cell *matCellDef="let user">
                  <span class="role-badge" [class.role-admin]="user.role === 'admin'" [class.role-superadmin]="user.role === 'superadmin'">
                    {{ user.role === 'admin' ? 'Администратор' : 'Суперадминистратор' }}
                  </span>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Дата создания</th>
                <td mat-cell *matCellDef="let user">{{ user.createdAt | date:'dd.MM.yyyy HH:mm' }}</td>
              </ng-container>
              
              <ng-container matColumnDef="updatedAt">
                <th mat-header-cell *matHeaderCellDef>Дата обновления</th>
                <td mat-cell *matCellDef="let user">{{ user.updatedAt | date:'dd.MM.yyyy HH:mm' }}</td>
              </ng-container>
              
              <ng-container matColumnDef="actions" *ngIf="authService.hasRole('superadmin')">
                <th mat-header-cell *matHeaderCellDef>Действия</th>
                <td mat-cell *matCellDef="let user">
                  <button 
                    mat-icon-button 
                    color="warn" 
                    (click)="deleteUser(user.id)"
                    matTooltip="Удалить пользователя">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-management-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .user-form-card {
      margin-bottom: 30px;
    }
    
    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .form-field {
      flex: 1;
    }
    
    .form-actions {
      text-align: right;
      margin-top: 10px;
    }
    
    .users-list-card {
      margin-top: 20px;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    .users-table {
      width: 100%;
    }
    
    .role-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .role-admin {
      background-color: #e3f2fd;
      color: #1976d2;
    }
    
    .role-superadmin {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }
    
    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .form-field {
        margin-bottom: 20px;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  userForm: FormGroup;
  displayedColumns: string[] = ['login', 'role', 'createdAt', 'updatedAt'];
  
  constructor(
    private fb: FormBuilder,
    private surveyService: SurveyService,
    public authService: AuthService,
    private dialog: MatDialog
  ) {
    this.userForm = this.createForm();
  }
  
  ngOnInit(): void {
    // В реальном приложении здесь будет загрузка пользователей с сервера
    this.loadUsers();
    
    // Добавляем столбец действий, если пользователь - суперадмин
    if (this.authService.hasRole('superadmin')) {
      this.displayedColumns.push('actions');
    }
  }
  
  private createForm(): FormGroup {
    return this.fb.group({
      login: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(64)]],
      role: ['admin', Validators.required],
      password: ['', [Validators.required, this.passwordValidator]],
      confirmPassword: ['', Validators.required]
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
    const password = formGroup.get('password');
    const confirmPassword = formGroup.get('confirmPassword');
    
    if (!password || !confirmPassword) return null;
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }
  
  getLoginErrorMessage(): string {
    const control = this.userForm.get('login');
    if (control?.errors?.['required']) {
      return 'Логин обязателен для заполнения';
    }
    if (control?.errors?.['minlength']) {
      return 'Логин должен содержать не менее 3 символов';
    }
    if (control?.errors?.['maxlength']) {
      return 'Логин должен содержать не более 64 символов';
    }
    return 'Некорректный логин';
  }
  
  getPasswordErrorMessage(): string {
    const control = this.userForm.get('password');
    if (control?.errors?.['required']) {
      return 'Пароль обязателен для заполнения';
    }
    if (control?.errors?.['passwordRequirements']) {
      return 'Пароль должен содержать не менее 8 символов, включая заглавные и строчные буквы, цифры и спецсимвол (!@#$%^&*)';
    }
    return 'Некорректный пароль';
  }
  
  createUser(): void {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      
const userToCreate = {
  login: this.userForm.value.login,
  role: this.userForm.value.role,
  createdAt: new Date().toISOString(),       
  updatedAt: new Date().toISOString(),       
};
      
      this.surveyService.createUser(userToCreate).subscribe({
        next: (user) => {
          console.log('User created successfully', user);
          // Добавляем нового пользователя в список
          this.users = [user, ...this.users];
          this.userForm.reset();
          this.userForm.get('role')?.setValue('admin');
          alert('Пользователь успешно создан');
        },
        error: (error) => {
          console.error('Error creating user', error);
          alert('Ошибка при создании пользователя: ' + (error.error?.message || 'Неизвестная ошибка'));
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }
  
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }
  
  private generateId(): string {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  private loadUsers(): void {
    this.surveyService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users', error);
        // В реальном приложении нужно показать сообщение об ошибке
      }
    });
  }
  
  deleteUser(userId: string): void {
    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      this.surveyService.deleteUser(userId).subscribe({
        next: () => {
          console.log('User deleted successfully');
          // Удаляем пользователя из списка
          this.users = this.users.filter(user => user.id !== userId);
          alert('Пользователь успешно удален');
        },
        error: (error) => {
          console.error('Error deleting user', error);
          alert('Ошибка при удалении пользователя: ' + (error.error?.message || 'Неизвестная ошибка'));
        }
      });
    }
  }
}