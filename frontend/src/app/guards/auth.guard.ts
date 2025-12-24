import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if the route is for public survey responses (f/:id)
  // This should be accessible to everyone, including non-authenticated users
  if (state.url.startsWith('/f/')) {
    return true;
  }

  // For all other routes, check authentication
  if (authService.isAuthenticated()) {
    return true;
  }

  // If not authenticated, redirect to login
  return authService.getCurrentUser().pipe(
    map(user => {
      if (user) {
        // User is authenticated, allow access
        authService.isAuthenticated.set(true);
        authService.currentUser.set(user);
        return true;
      } else {
        // User is not authenticated, redirect to login
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
    }),
    take(1)
  );
};