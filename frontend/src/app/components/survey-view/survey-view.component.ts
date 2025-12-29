import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SurveyService } from '../../services/survey.service';
import { Survey } from '../../models/survey.model';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';


@Component({
  selector: 'app-survey-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule,
    MatSnackBarModule

  ],
  template: `
    <div class="survey-view-container">
      <div class="header">
        <button 
          mat-icon-button 
          class="back-button"
          [routerLink]="['/surveys']"
          matTooltip="Назад к списку анкет">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ survey?.title }}</h1>
      </div>
      
      <div class="survey-info" *ngIf="survey">
        <mat-card class="survey-card">
          <mat-card-content>
            <p *ngIf="survey.description">{{ survey.description }}</p>
            
            <div class="survey-meta">
              <div class="meta-item">
                <mat-icon>visibility</mat-icon>
                <span>{{ survey.is_active ? 'Активна' : 'Неактивна' }}</span>
              </div>
              
              <div class="meta-item" *ngIf="survey.expires_at">
                <mat-icon>schedule</mat-icon>
                <span>{{ survey.expires_at | date:'dd.MM.yyyy HH:mm' }}</span>
              </div>
              
              <div class="meta-item">
                <mat-icon>lock</mat-icon>
                <span>{{ survey.is_anonymous ? 'Анонимная' : 'Не анонимная' }}</span>
              </div>
            </div>
            
            <div class="questions-section">
              <h3>Вопросы анкеты</h3>
              <div 
                class="question-item" 
                *ngFor="let question of survey.structure; trackBy: trackByQuestionId"
                [ngClass]="'question-type-' + question.type">
                <div class="question-header">
                  <h4>{{ question.label }}</h4>
                  <span 
                    class="required-indicator" 
                    *ngIf="question.required"
                    matTooltip="Обязательный вопрос"> *</span>
                </div>
                
                <p class="question-description" *ngIf="question.description">
                  {{ question.description }}
                </p>
                
                <div class="question-type-info">
                  Тип: {{ getQuestionTypeLabel(question.type) }}
                </div>
                
                <!-- Отображение вариантов для вопросов с выбором -->
                <div class="question-options" *ngIf="isChoiceQuestion(question.type) && question.options">
                  <div class="option" *ngFor="let option of question.options">
                    <mat-icon>radio_button_unchecked</mat-icon>
                    <span>{{ option.label }}</span>
                  </div>
                </div>
                
                <!-- Отображение параметров шкалы -->
                <div class="scale-params" *ngIf="question.type === 'scale'">
                  <div class="param">Мин: {{ question.min || 1 }}</div>
                  <div class="param">Макс: {{ question.max || 5 }}</div>
                  <div class="param">Шаг: {{ question.step || 1 }}</div>
                </div>
              </div>
            </div>
          </mat-card-content>
          
          <mat-card-actions class="card-actions">
            <button 
              mat-raised-button 
              color="primary"
              [routerLink]="['/f', survey.id]"
              target="_blank"
              matTooltip="Открыть анкету для заполнения">
              <mat-icon>open_in_new</mat-icon>
              Открыть для заполнения
            </button>
            
            <button 
              mat-raised-button 
              color="accent"
              (click)="copySurveyLink(survey.id)"
              matTooltip="Скопировать ссылку на анкету">
              <mat-icon>link</mat-icon>
              Скопировать ссылку
            </button>
            
            <button 
              mat-raised-button 
              color="primary"
              [routerLink]="['/surveys', survey.id, 'responses']"
              matTooltip="Просмотреть ответы">
              <mat-icon>data_usage</mat-icon>
              Ответы
            </button>
            
            <button 
              mat-raised-button 
              color="primary"
              [routerLink]="['/surveys', survey.id, 'stats']"
              matTooltip="Просмотреть статистику">
              <mat-icon>bar_chart</mat-icon>
              Статистика
            </button>
            
            <button 
              mat-raised-button 
              color="primary"
              [routerLink]="['/surveys', survey.id, 'edit']"
              matTooltip="Редактировать анкету"
              *ngIf="canEdit()">
              <mat-icon>edit</mat-icon>
              Редактировать
            </button>
            
            <button 
              mat-raised-button 
              color="warn"
              (click)="deleteSurvey(survey.id, survey.title)"
              matTooltip="Удалить анкету"
              *ngIf="canEdit()">
              <mat-icon>delete</mat-icon>
              Удалить
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .survey-view-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .header h1 {
      margin: 0 0 0 10px;
    }
    
    .survey-card {
      margin-top: 20px;
    }
    
    .survey-meta {
      display: flex;
      gap: 20px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }
    
    .questions-section h3 {
      margin: 20px 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .question-item {
      padding: 15px;
      margin-bottom: 15px;
      border: 1px solid #eee;
      border-radius: 8px;
      background-color: #fafafa;
    }
    
    .question-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .question-header h4 {
      margin: 0;
      flex: 1;
    }
    
    .required-indicator {
      color: #f44336;
      font-weight: bold;
    }
    
    .question-description {
      margin: 8px 0;
      color: #666;
      font-style: italic;
    }
    
    .question-type-info {
      font-size: 12px;
      color: #666;
      margin: 5px 0;
    }
    
    .question-options {
      margin: 10px 0;
    }
    
    .option {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 5px 0;
      padding: 4px 0;
    }
    
    .scale-params {
      display: flex;
      gap: 15px;
      margin-top: 10px;
      font-size: 12px;
    }
    
    .param {
      background-color: #e3f2fd;
      padding: 4px 8px;
      border-radius: 4px;
    }
    
    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: flex-end;
    }
    
    @media (max-width: 768px) {
      .survey-meta {
        flex-direction: column;
        gap: 10px;
      }
      
      .card-actions {
        flex-direction: column;
      }
      
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      
      .header h1 {
        margin: 0;
      }
    }
  `]
})
export class SurveyViewComponent implements OnInit {
  survey: Survey | null = null;

  constructor(
    private surveyService: SurveyService,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
  private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadSurvey(id);
      }
    });
  }

  private loadSurvey(id: string): void {
    this.surveyService.getSurvey(id).subscribe({
      next: (survey) => {
        this.survey = survey;
      },
      error: (error) => {
        console.error('Error loading survey', error);
        this.router.navigate(['/surveys']);
      }
    });
  }

  getQuestionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      text: 'Текст (однострочный)',
      textarea: 'Текст (многострочный)',
      radio: 'Радиокнопки',
      select: 'Выпадающий список',
      checkbox: 'Чекбоксы',
      email: 'Email',
      phone: 'Телефон',
      date: 'Дата',
      datetime: 'Дата и время',
      scale: 'Шкала'
    };
    
    return labels[type] || type;
  }

  isChoiceQuestion(type: string): boolean {
    return ['radio', 'select', 'checkbox'].includes(type);
  }

  trackByQuestionId(index: number, question: any): string {
    return question.id;
  }

copySurveyLink(surveyId: string): void {
  const url = `${window.location.origin}/f/${surveyId}`;
  const successMessage = 'Ссылка скопирована в буфер обмена';
  const errorMessage = 'Не удалось скопировать ссылку. Попробуйте вручную.';

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => {
        this.snackBar.open(successMessage, 'Закрыть', { duration: 2000 });
      })
      .catch(err => {
        console.warn('Clipboard API failed, falling back to legacy method', err);
        this.fallbackCopyTextToClipboard(url, successMessage, errorMessage);
      });
  } else {
    this.fallbackCopyTextToClipboard(url, successMessage, errorMessage);
  }
}

private fallbackCopyTextToClipboard(text: string, successMsg: string, errorMsg: string): void {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed'; // не виден пользователю
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const success = document.execCommand('copy');
    if (success) {
      this.snackBar.open(successMsg, 'Закрыть', { duration: 2000 });
    } else {
      this.snackBar.open(errorMsg, 'Закрыть', { duration: 4000 });
    }
  } catch (err) {
    console.error('Fallback copy failed', err);
    this.snackBar.open(errorMsg, 'Закрыть', { duration: 4000 });
  } finally {
    document.body.removeChild(textarea);
  }

  canEdit(): boolean {
    if (!this.survey || !this.authService.currentUser()) {
      return false;
    }
    
    const user = this.authService.currentUser();
    // Администратор может редактировать свои анкеты, суперадмин может редактировать любые
    return user?.role === 'superadmin' || 
           (user?.role === 'admin' && this.survey.created_by === user.id);
  }

  deleteSurvey(id: string, title: string): void {
    if (confirm(`Вы уверены, что хотите удалить анкету "${title}"? Это действие нельзя отменить.`)) {
      this.surveyService.deleteSurvey(id).subscribe({
        next: () => {
          this.snackBar.open('Анкета успешно удалена', 'Закрыть', { duration: 3000 });
          this.router.navigate(['/surveys']);
        },
        error: (error) => {
          console.error('Ошибка при удалении анкеты', error);
          this.snackBar.open('Ошибка при удалении анкеты', 'Закрыть', { duration: 3000 });
        }
      });
    }
  }
}