import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthResponse, User, ChangePasswordRequest } from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = '/api/v1';
  
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);

  constructor(private http: HttpClient) {
    // Check if user is already authenticated by trying to get user info
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    // Try to get current user to check if authenticated
    this.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      },
      error: (error) => {
        // User is not authenticated
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
      }
    });
  }

  login(login: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, { login, password })
      .pipe(
        tap(response => {
          // After login, get user info to set current user
          this.getCurrentUser().subscribe({
            next: (user) => {
              this.currentUser.set(user);
              this.isAuthenticated.set(true);
            },
            error: (error) => {
              console.error('Failed to load user info after login', error);
            }
          });
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Call logout endpoint to clear server-side session/cookie
    this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe({
      next: () => {
        // Clear local state
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
      },
      error: (error) => {
        // Even if logout request fails, clear local state
        this.currentUser.set(null);
        this.isAuthenticated.set(false);
        console.error('Logout error:', error);
      }
    });
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/change-password`, request)
      .pipe(
        catchError(error => {
          console.error('Change password error:', error);
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/refresh`, {})
      .pipe(
        catchError(error => {
          console.error('Refresh token error:', error);
          return throwError(() => error);
        })
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`)
      .pipe(
        catchError(error => {
          // Don't log this as error if it's a 401 (unauthorized)
          if (error.status !== 401) {
            console.error('Get current user error:', error);
          }
          return throwError(() => error);
        })
      );
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