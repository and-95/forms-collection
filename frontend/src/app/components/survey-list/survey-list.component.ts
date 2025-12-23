import { Component, OnInit } from '@angular/core';
import { Router, NgFor, NgIf } from '@angular/router';
import { SurveyService } from '../../services/survey.service';
import { AuthService } from '../../services/auth.service';
import { Survey } from '../../models/survey.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-survey-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    NgFor,
    NgIf
  ],
  template: `
    <div class="survey-list-container">
      <div class="header">
        <h1>Мои анкеты</h1>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="createSurvey()"
          *ngIf="authService.hasAnyRole(['admin', 'superadmin'])">
          Создать анкету
        </button>
      </div>
      
      <div class="survey-cards" *ngIf="surveys.length > 0; else noSurveys">
        <mat-card 
          class="survey-card" 
          *ngFor="let survey of surveys; trackBy: trackBySurveyId"
          (click)="viewSurvey(survey.id)">
          <mat-card-header>
            <mat-card-title>{{ survey.title }}</mat-card-title>
            <mat-card-subtitle>{{ survey.description }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="survey-details">
              <div class="status">
                <mat-icon [class.active]="survey.isActive" [class.inactive]="!survey.isActive">
                  {{ survey.isActive ? 'check_circle' : 'cancel' }}
                </mat-icon>
                <span>{{ survey.isActive ? 'Активна' : 'Неактивна' }}</span>
              </div>
              
              <div class="responses-count">
                <mat-icon>data_usage</mat-icon>
                <span>{{ survey.responseCount || 0 }} ответов</span>
              </div>
              
              <div class="expires-at" *ngIf="survey.expiresAt">
                <mat-icon>schedule</mat-icon>
                <span>{{ survey.expiresAt | date:'dd.MM.yyyy HH:mm' }}</span>
              </div>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button (click)="editSurvey(survey.id)">Редактировать</button>
            <button mat-button (click)="viewResponses(survey.id)">Ответы</button>
            <button 
              mat-button 
              *ngIf="authService.hasRole('superadmin')"
              (click)="viewSurvey(survey.id)">
              Посмотреть
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      
      <ng-template #noSurveys>
        <div class="no-surveys" *ngIf="!loading">
          <h3>У вас пока нет анкет</h3>
          <p>Создайте первую анкету, чтобы начать сбор ответов</p>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="createSurvey()"
            *ngIf="authService.hasAnyRole(['admin', 'superadmin'])">
            Создать анкету
          </button>
        </div>
        <div class="loading" *ngIf="loading">
          <p>Загрузка анкет...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .survey-list-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    
    .header h1 {
      margin: 0;
    }
    
    .survey-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    
    .survey-card {
      cursor: pointer;
      transition: box-shadow 0.3s ease;
    }
    
    .survey-card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    
    .survey-details {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .survey-details > div {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }
    
    .status .active {
      color: #4caf50;
    }
    
    .status .inactive {
      color: #f44336;
    }
    
    .no-surveys {
      text-align: center;
      padding: 40px;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
    }
    
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }
      
      .survey-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SurveyListComponent implements OnInit {
  surveys: Survey[] = [];
  loading = false;

  constructor(
    private surveyService: SurveyService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSurveys();
  }

  loadSurveys(): void {
    this.loading = true;
    this.surveyService.getSurveys().subscribe({
      next: (surveys) => {
        this.surveys = surveys.map(survey => ({
          ...survey,
          responseCount: this.calculateResponseCount(survey)
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading surveys', error);
        this.loading = false;
      }
    });
  }

  calculateResponseCount(survey: Survey): number {
    // В реальном приложении это значение будет приходить с бэкенда
    return 0;
  }

  createSurvey(): void {
    this.router.navigate(['/surveys/create']);
  }

  editSurvey(id: string): void {
    this.router.navigate([`/surveys/${id}/edit`]);
    // Предотвращаем переход к деталям анкеты
    event?.stopImmediatePropagation();
  }

  viewSurvey(id: string): void {
    this.router.navigate([`/surveys/${id}`]);
  }

  viewResponses(id: string): void {
    this.router.navigate([`/surveys/${id}/responses`]);
    event?.stopImmediatePropagation();
  }

  trackBySurveyId(index: number, survey: Survey): string {
    return survey.id;
  }
}