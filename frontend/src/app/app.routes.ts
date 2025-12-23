import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'surveys', loadComponent: () => import('./components/survey-list/survey-list.component').then(m => m.SurveyListComponent) },
  { path: 'surveys/create', loadComponent: () => import('./components/survey-builder/survey-builder.component').then(m => m.SurveyBuilderComponent) },
  { path: 'surveys/:id', loadComponent: () => import('./components/survey-view/survey-view.component').then(m => m.SurveyViewComponent) },
  { path: 'surveys/:id/edit', loadComponent: () => import('./components/survey-builder/survey-builder.component').then(m => m.SurveyBuilderComponent) },
  { path: 'surveys/:id/responses', loadComponent: () => import('./components/survey-responses/survey-responses.component').then(m => m.SurveyResponsesComponent) },
  { path: 'surveys/:id/stats', loadComponent: () => import('./components/survey-stats/survey-stats.component').then(m => m.SurveyStatsComponent) },
  { path: 'f/:id', loadComponent: () => import('./components/survey-renderer/survey-renderer.component').then(m => m.SurveyRendererComponent) },
  { path: 'admin/users', loadComponent: () => import('./components/user-management/user-management.component').then(m => m.UserManagementComponent) },
  { path: '**', redirectTo: '' }
];
