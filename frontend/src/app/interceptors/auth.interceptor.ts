//auth.interceptor.ts

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthResponse } from '../models/survey.model';

@Injectable()
export class AuthInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<AuthResponse | null> = new BehaviorSubject<AuthResponse | null>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // For API requests, include credentials (cookies) with each request
    // httpOnly cookies will be automatically included by the browser
    if (req.url.includes('http://172.16.153.98:3000/api/v1')) {
      req = req.clone({
        withCredentials: true  // This ensures cookies are sent with requests
      });
    }

    return next.handle(req).pipe(
      catchError((error) => {
        // Обработка ошибок аутентификации
        if (error.status === 401 && !req.url.includes('/auth/refresh')) {
          // Токен истек, нужно обновить
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.authService.refreshToken().pipe(
              switchMap((response: AuthResponse) => {
                this.isRefreshing = false;
                this.refreshTokenSubject.next(response);
                // Повторяем оригинальный запрос
                return next.handle(req);
              }),
              catchError((refreshError) => {
                this.isRefreshing = false;
                // Если обновить токен не удалось, пользователь выходит из системы
                this.authService.logout();
                return throwError(() => refreshError);
              })
            );
          } else {
            // Если уже идет процесс обновления токена, ждем его завершения
            return this.refreshTokenSubject.pipe(
              filter(result => result !== null),
              take(1),
              switchMap(() => {
                return next.handle(req);
              })
            );
          }
        }
        return throwError(() => error);
      })
    );
  }
}