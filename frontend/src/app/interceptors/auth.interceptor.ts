import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // For API requests, include credentials (cookies) with each request
    // httpOnly cookies will be automatically included by the browser
    if (req.url.startsWith('/api/v1')) {
      req = req.clone({
        withCredentials: true  // This ensures cookies are sent with requests
      });
    }

    return next.handle(req).pipe(
      catchError((error) => {
        // Обработка ошибок аутентификации
        if (error.status === 401) {
          // Токен истек, возможно, нужно обновить
          console.error('Unauthorized request', error);
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}