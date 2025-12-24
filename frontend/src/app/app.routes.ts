import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AuthLayoutComponent } from './components/layout/auth-layout.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'surveys', loadComponent: () => import('./components/survey-list/survey-list.component').then(m => m.SurveyListComponent) },
      { path: 'surveys/create', loadComponent: () => import('./components/survey-builder/survey-builder.component').then(m => m.SurveyBuilderComponent) },
      { path: 'surveys/:id', loadComponent: () => import('./components/survey-view/survey-view.component').then(m => m.SurveyViewComponent) },
      { path: 'surveys/:id/edit', loadComponent: () => import('./components/survey-builder/survey-builder.component').then(m => m.SurveyBuilderComponent) },
      { path: 'surveys/:id/responses', loadComponent: () => import('./components/survey-responses/survey-responses.component').then(m => m.SurveyResponsesComponent) },
      { path: 'surveys/:id/stats', loadComponent: () => import('./components/survey-stats/survey-stats.component').then(m => m.SurveyStatsComponent) },
      { path: 'admin/users', loadComponent: () => import('./components/user-management/user-management.component').then(m => m.UserManagementComponent) },
      { path: 'profile', loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent) },
    ]
  },
  { path: 'f/:id', loadComponent: () => import('./components/survey-renderer/survey-renderer.component').then(m => m.SurveyRendererComponent) },
  { path: '**', redirectTo: '/login' }
];
