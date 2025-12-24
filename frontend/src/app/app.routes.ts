import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'surveys', loadComponent: () => import('./components/survey-list/survey-list.component').then(m => m.SurveyListComponent), canActivate: [authGuard] },
  { path: 'surveys/create', loadComponent: () => import('./components/survey-builder/survey-builder.component').then(m => m.SurveyBuilderComponent), canActivate: [authGuard] },
  { path: 'surveys/:id', loadComponent: () => import('./components/survey-view/survey-view.component').then(m => m.SurveyViewComponent), canActivate: [authGuard] },
  { path: 'surveys/:id/edit', loadComponent: () => import('./components/survey-builder/survey-builder.component').then(m => m.SurveyBuilderComponent), canActivate: [authGuard] },
  { path: 'surveys/:id/responses', loadComponent: () => import('./components/survey-responses/survey-responses.component').then(m => m.SurveyResponsesComponent), canActivate: [authGuard] },
  { path: 'surveys/:id/stats', loadComponent: () => import('./components/survey-stats/survey-stats.component').then(m => m.SurveyStatsComponent), canActivate: [authGuard] },
  { path: 'f/:id', loadComponent: () => import('./components/survey-renderer/survey-renderer.component').then(m => m.SurveyRendererComponent) },
  { path: 'admin/users', loadComponent: () => import('./components/user-management/user-management.component').then(m => m.UserManagementComponent), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
