import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User, ChangePasswordRequest } from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/v1';
  private readonly USER_KEY = 'currentUser';
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem(this.USER_KEY);
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    
    if (storedUser && accessToken) {
      this.currentUser.set(JSON.parse(storedUser));
      this.isAuthenticated.set(true);
    }
  }

  login(login: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, { login, password })
      .pipe(
        tap(response => {
          this.setSession(response);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/change-password`, request);
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, {});
  }

  private setSession(authResponse: AuthResponse): void {
    // В реальном приложении токены будут в httpOnly cookie
    // Для демонстрации сохраняем в localStorage
    localStorage.setItem(this.ACCESS_TOKEN_KEY, authResponse.accessToken);
    // refreshToken обычно хранится в httpOnly cookie, но в демонстрации может быть в localStorage
    
    // После успешного входа получаем информацию о пользователе
    this.loadCurrentUser().subscribe({
      next: (user) => {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      },
      error: (error) => {
        console.error('Failed to load user info', error);
      }
    });
  }

  private loadCurrentUser(): Observable<User> {
    // В реальном приложении этот эндпоинт будет возвращать информацию о текущем пользователе
    // на основе токена в заголовке Authorization
    return this.http.get<User>(`${this.API_URL}/auth/me`);
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`);
  }

  hasRole(requiredRole: 'admin' | 'superadmin'): boolean {
    const user = this.currentUser();
    return user?.role === requiredRole;
  }

  hasAnyRole(allowedRoles: ('admin' | 'superadmin')[]): boolean {
    const user = this.currentUser();
    return user ? allowedRoles.includes(user.role) : false;
  }
}