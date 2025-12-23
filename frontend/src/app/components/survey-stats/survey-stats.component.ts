import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SurveyService } from '../../services/survey.service';
import { Survey, Question, QuestionType } from '../../models/survey.model';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-survey-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatProgressBarModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="stats-container" *ngIf="survey; else loadingTemplate">
      <div class="header">
        <h1>{{ survey.title }} - Статистика</h1>
        <p>{{ survey.description }}</p>
      </div>
      
      <mat-card class="stats-card">
        <mat-card-content>
          <div class="stats-overview">
            <div class="stat-item">
              <mat-icon color="primary">data_usage</mat-icon>
              <div class="stat-value">{{ responses.length }}</div>
              <div class="stat-label">Всего ответов</div>
            </div>
            <div class="stat-item">
              <mat-icon color="accent">calendar_today</mat-icon>
              <div class="stat-value">{{ survey.createdAt | date:'dd.MM.yyyy' }}</div>
              <div class="stat-label">Создана</div>
            </div>
            <div class="stat-item" *ngIf="survey.expiresAt">
              <mat-icon color="warn">schedule</mat-icon>
              <div class="stat-value">{{ survey.expiresAt | date:'dd.MM.yyyy HH:mm' }}</div>
              <div class="stat-label">Истекает</div>
            </div>
          </div>
          
          <mat-tab-group>
            <mat-tab label="По вопросам">
              <div class="questions-stats" *ngIf="survey.structure.length > 0; else noQuestionsTemplate">
                <div 
                  class="question-stat" 
                  *ngFor="let question of survey.structure; trackBy: trackByQuestionId"
                  [ngClass]="{'choice-question': isChoiceQuestion(question.type)}">
                  <mat-card class="question-card">
                    <mat-card-header>
                      <mat-card-title>{{ question.label }}</mat-card-title>
                      <mat-card-subtitle *ngIf="question.description">{{ question.description }}</mat-card-subtitle>
                    </mat-card-header>
                    
                    <mat-card-content>
                      <div class="question-info">
                        <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
                        <span class="question-required" *ngIf="question.required" matTooltip="Обязательный вопрос"> *</span>
                      </div>
                      
                      <!-- Статистика для вопросов с выбором -->
                      <div class="choice-stats" *ngIf="isChoiceQuestion(question.type) && question.options">
                        <table mat-table [dataSource]="getQuestionStats(question.id)" class="stats-table">
                          <ng-container matColumnDef="option">
                            <th mat-header-cell *matHeaderCellDef>Вариант</th>
                            <td mat-cell *matCellDef="let element">{{ getOptionLabel(question.options || [], element.optionId) }}</td>
                          </ng-container>
                          
                          <ng-container matColumnDef="count">
                            <th mat-header-cell *matHeaderCellDef>Кол-во</th>
                            <td mat-cell *matCellDef="let element">{{ element.count }}</td>
                          </ng-container>
                          
                          <ng-container matColumnDef="percentage">
                            <th mat-header-cell *matHeaderCellDef>%</th>
                            <td mat-cell *matCellDef="let element">
                              <div class="percentage-container">
                                <mat-progress-bar 
                                  mode="determinate" 
                                  [value]="element.percentage"
                                  color="primary">
                                </mat-progress-bar>
                                <span class="percentage-value">{{ element.percentage | number:'1.1-1' }}%</span>
                              </div>
                            </td>
                          </ng-container>
                          
                          <tr mat-header-row *matHeaderRowDef="['option', 'count', 'percentage']"></tr>
                          <tr mat-row *matRowDef="let row; columns: ['option', 'count', 'percentage'];"></tr>
                        </table>
                      </div>
                      
                      <!-- Статистика для текстовых вопросов -->
                      <div class="text-stats" *ngIf="isTextQuestion(question.type)">
                        <div class="responses-list">
                          <div 
                            class="response-item" 
                            *ngFor="let response of getTextResponses(question.id); trackBy: trackByResponseValue"
                            [innerHTML]="formatResponseValue(response)">
                          </div>
                        </div>
                      </div>
                      
                      <!-- Статистика для шкалы -->
                      <div class="scale-stats" *ngIf="question.type === 'scale'">
                        <div class="scale-summary">
                          <div class="scale-average">
                            <h4>Среднее значение: {{ getScaleAverage(question.id) | number:'1.1-1' }}</h4>
                          </div>
                          <div class="scale-distribution">
                            <div 
                              class="scale-bar" 
                              *ngFor="let item of getScaleDistribution(question.id); trackBy: trackByScaleValue"
                              [style.width.%]="item.percentage">
                              <span class="scale-value">{{ item.value }}: {{ item.count }} ({{ item.percentage | number:'1.1-1' }}%)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                </div>
              </div>
            </mat-tab>
            
            <mat-tab label="Общая статистика">
              <div class="general-stats">
                <h3>Статистика по анкете</h3>
                <div class="responses-overview">
                  <div class="response-item" *ngFor="let response of responses; trackBy: trackByResponseId">
                    <span>Ответ #{{ responses.indexOf(response) + 1 }}</span>
                    <span>{{ response.submittedAt | date:'dd.MM.yyyy HH:mm' }}</span>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
    
    <ng-template #loadingTemplate>
      <div class="loading">
        <p>Загрузка статистики...</p>
      </div>
    </ng-template>
    
    <ng-template #noQuestionsTemplate>
      <div class="no-questions">
        <p>Нет вопросов для отображения статистики.</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .stats-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-item {
      text-align: center;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 8px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .stat-label {
      color: #666;
      font-size: 14px;
    }
    
    .question-card {
      margin-bottom: 20px;
    }
    
    .question-info {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .question-type {
      background-color: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 8px;
    }
    
    .question-required {
      color: #f44336;
      font-weight: bold;
    }
    
    .stats-table {
      width: 100%;
      margin-top: 15px;
    }
    
    .percentage-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .percentage-value {
      min-width: 50px;
      text-align: right;
      font-weight: bold;
    }
    
    .text-stats {
      margin-top: 15px;
    }
    
    .responses-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 10px;
    }
    
    .response-item {
      padding: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .response-item:last-child {
      border-bottom: none;
    }
    
    .scale-summary {
      margin-top: 15px;
    }
    
    .scale-average {
      margin-bottom: 20px;
    }
    
    .scale-distribution {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    
    .scale-bar {
      display: flex;
      align-items: center;
      height: 30px;
      background-color: #e3f2fd;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .scale-value {
      padding: 0 10px;
      font-size: 12px;
      font-weight: bold;
      color: #1976d2;
    }
    
    .general-stats {
      padding: 20px 0;
    }
    
    .responses-overview {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }
    
    .loading, .no-questions {
      text-align: center;
      padding: 40px;
    }
    
    @media (max-width: 768px) {
      .stats-overview {
        grid-template-columns: 1fr;
      }
      
      .percentage-container {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class SurveyStatsComponent implements OnInit {
  survey: Survey | null = null;
  responses: any[] = [];
  questionStats: Record<string, any[]> = {};

  constructor(
    private surveyService: SurveyService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadSurvey(id);
        this.loadResponses(id);
      }
    });
  }

  private loadSurvey(id: string): void {
    this.surveyService.getSurvey(id).subscribe({
      next: (survey) => {
        this.survey = survey;
        // Вычисляем статистику после загрузки анкеты
        setTimeout(() => {
          if (this.responses.length > 0 && this.survey) {
            this.calculateStats();
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error loading survey', error);
      }
    });
  }

  private loadResponses(id: string): void {
    this.surveyService.getSurveyResponses(id).subscribe({
      next: (responses) => {
        this.responses = responses;
        if (this.survey) {
          this.calculateStats();
        }
      },
      error: (error) => {
        console.error('Error loading responses', error);
      }
    });
  }

  private calculateStats(): void {
    if (!this.survey || !this.responses.length) return;

    this.questionStats = {};
    
    for (const question of this.survey.structure) {
      if (this.isChoiceQuestion(question.type) && question.options) {
        const stats: any[] = [];
        const optionCounts: Record<string, number> = {};
        
        // Подсчитываем количество ответов для каждого варианта
        for (const response of this.responses) {
          const value = response.data[question.id];
          if (value) {
            if (Array.isArray(value)) {
              // Для чекбоксов (множественный выбор)
              for (const optionId of value) {
                optionCounts[optionId] = (optionCounts[optionId] || 0) + 1;
              }
            } else {
              // Для одиночного выбора
              optionCounts[value] = (optionCounts[value] || 0) + 1;
            }
          }
        }
        
        // Формируем статистику для каждого варианта
        for (const option of question.options) {
          const count = optionCounts[option.id] || 0;
          const percentage = this.responses.length > 0 ? (count / this.responses.length) * 100 : 0;
          
          stats.push({
            optionId: option.id,
            count,
            percentage: parseFloat(percentage.toFixed(1))
          });
        }
        
        this.questionStats[question.id] = stats;
      }
    }
  }

  getQuestionStats(questionId: string): any[] {
    return this.questionStats[questionId] || [];
  }

  getTextResponses(questionId: string): any[] {
    const responses: any[] = [];
    for (const response of this.responses) {
      const value = response.data[questionId];
      if (value && value !== '') {
        responses.push(value);
      }
    }
    return responses;
  }

  getScaleAverage(questionId: string): number {
    if (!this.responses.length) return 0;
    
    let sum = 0;
    let count = 0;
    
    for (const response of this.responses) {
      const value = response.data[questionId];
      if (value !== undefined && value !== null) {
        sum += Number(value);
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0;
  }

  getScaleDistribution(questionId: string): any[] {
    const distribution: Record<number, number> = {};
    const question = this.survey?.structure.find(q => q.id === questionId);
    
    // Инициализируем диапазон значений
    const min = question?.min || 1;
    const max = question?.max || 5;
    for (let i = min; i <= max; i++) {
      distribution[i] = 0;
    }
    
    // Подсчитываем значения
    for (const response of this.responses) {
      const value = response.data[questionId];
      if (value !== undefined && value !== null) {
        const numValue = Number(value);
        if (distribution.hasOwnProperty(numValue)) {
          distribution[numValue]++;
        }
      }
    }
    
    // Преобразуем в массив с процентами
    const result = [];
    for (let i = min; i <= max; i++) {
      const count = distribution[i] || 0;
      const percentage = this.responses.length > 0 ? (count / this.responses.length) * 100 : 0;
      result.push({
        value: i,
        count,
        percentage: parseFloat(percentage.toFixed(1))
      });
    }
    
    return result;
  }

  isChoiceQuestion(type: QuestionType): boolean {
    return ['radio', 'select', 'checkbox'].includes(type);
  }

  isTextQuestion(type: QuestionType): boolean {
    return ['text', 'textarea', 'email', 'phone'].includes(type);
  }

  getOptionLabel(options: { id: string; label: string }[], optionId: string): string {
    const option = options.find(opt => opt.id === optionId);
    return option ? option.label : optionId;
  }

  getQuestionTypeLabel(type: QuestionType): string {
    const labels: Record<QuestionType, string> = {
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

  formatResponseValue(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }

  trackByQuestionId(index: number, question: Question): string {
    return question.id;
  }

  trackByResponseValue(index: number, response: any): any {
    return response;
  }

  trackByResponseId(index: number, response: any): string {
    return response.id;
  }

  trackByScaleValue(index: number, item: any): number {
    return item.value;
  }
}