import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Публичные маршруты — разрешаем без проверки
  if (state.url.startsWith('/f/')) {
    return true;
  }

  // Если уже известно, что пользователь авторизован — пропускаем
  if (authService.isAuthenticated()) {
    return true;
  }

  // Если статус неизвестен (например, при первом заходе), 
  // проверяем через /auth/me и сохраняем состояние
  return authService.getCurrentUser().pipe(
    map(user => {
      if (user) {
        // Обновляем сигналы — на случай, если checkAuthStatus() ещё не завершился
        authService.currentUser.set(user);
        authService.isAuthenticated.set(true);
        return true;
      } else {
        // Не авторизован → редирект на /login с returnUrl
        router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        return false;
      }
    }),
    take(1)
  );
};