import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyService } from '../../services/survey.service';
import { Survey, Question, QuestionType, SurveySubmission } from '../../models/survey.model';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-survey-renderer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgFor,
    NgIf
  ],
  template: `
    <div class="survey-container" *ngIf="!isSubmitted; else thankYouTemplate">
      <div class="survey-header">
        <h1>{{ survey?.title }}</h1>
        <p>{{ survey?.description }}</p>
      </div>
      
      <form 
        class="survey-form" 
        [formGroup]="surveyForm" 
        (ngSubmit)="submitSurvey()">
        <div 
          class="question-container" 
          *ngFor="let question of survey?.structure; let i = index; trackBy: trackByQuestionId"
          [formGroup]="getQuestionGroup(question.id)">
          <mat-card class="question-card">
            <mat-card-header>
              <mat-card-title>{{ question.label }}</mat-card-title>
              <mat-card-subtitle *ngIf="question.description">{{ question.description }}</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <!-- Текстовое поле -->
              <mat-form-field 
                *ngIf="question.type === 'text' || question.type === 'textarea'"
                class="question-field">
                <input 
                  *ngIf="question.type === 'text'"
                  matInput 
                  [formControlName]="question.id"
                  [placeholder]="question.label">
                <textarea 
                  *ngIf="question.type === 'textarea'"
                  matInput 
                  [formControlName]="question.id"
                  [placeholder]="question.label"
                  rows="3"></textarea>
                <mat-error *ngIf="getControl(question.id).invalid && getControl(question.id).touched">
                  {{ getErrorMessage(question) }}
                </mat-error>
              </mat-form-field>
              
              <!-- Email и телефон -->
              <mat-form-field 
                *ngIf="question.type === 'email' || question.type === 'phone'"
                class="question-field">
                <input 
                  matInput 
                  [formControlName]="question.id"
                  [placeholder]="question.label"
                  [type]="question.type">
                <mat-error *ngIf="getControl(question.id).invalid && getControl(question.id).touched">
                  {{ getErrorMessage(question) }}
                </mat-error>
              </mat-form-field>
              
              <!-- Выбор даты -->
              <mat-form-field 
                *ngIf="question.type === 'date'"
                class="question-field">
                <input 
                  matInput 
                  [matDatepicker]="picker" 
                  [formControlName]="question.id"
                  [placeholder]="question.label">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="getControl(question.id).invalid && getControl(question.id).touched">
                  {{ getErrorMessage(question) }}
                </mat-error>
              </mat-form-field>
              
              <!-- Радиокнопки -->
              <mat-radio-group 
                *ngIf="question.type === 'radio'" 
                [formControlName]="question.id"
                class="radio-group">
                <mat-radio-button 
                  class="radio-button" 
                  *ngFor="let option of question.options" 
                  [value]="option.id">
                  {{ option.label }}
                </mat-radio-button>
              </mat-radio-group>
              
              <!-- Выпадающий список -->
              <mat-form-field 
                *ngIf="question.type === 'select'"
                class="question-field">
                <mat-select [formControlName]="question.id" [placeholder]="question.label">
                  <mat-option *ngFor="let option of question.options" [value]="option.id">
                    {{ option.label }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="getControl(question.id).invalid && getControl(question.id).touched">
                  {{ getErrorMessage(question) }}
                </mat-error>
              </mat-form-field>
              
              <!-- Чекбоксы -->
              <div 
                *ngIf="question.type === 'checkbox'"
                class="checkbox-group">
                <mat-checkbox 
                  *ngFor="let option of question.options" 
                  [value]="option.id"
                  (change)="onCheckboxChange(question.id, option.id, $event.checked)">
                  {{ option.label }}
                </mat-checkbox>
              </div>
              
              <!-- Шкала -->
              <div 
                *ngIf="question.type === 'scale'"
                class="scale-container">
                <div class="scale-labels">
                  <span>{{ question.min || 1 }}</span>
                  <span>{{ question.max || 5 }}</span>
                </div>
                <mat-slider 
                  [min]="question.min || 1" 
                  [max]="question.max || 5" 
                  [step]="question.step || 1"
                  [formControlName]="question.id">
                </mat-slider>
                <div class="scale-value">{{ getControl(question.id).value }}</div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
        
        <div class="form-actions">
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="!surveyForm.valid">
            Отправить
          </button>
        </div>
      </form>
    </div>
    
    <ng-template #thankYouTemplate>
      <div class="thank-you-container">
        <h1>Спасибо за участие!</h1>
        <p>Ваш ответ успешно сохранен.</p>
        <button mat-raised-button color="primary" (click)="goHome()">Вернуться на главную</button>
      </div>
    </ng-template>
  `,
  styles: [`
    .survey-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .survey-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .survey-header h1 {
      margin: 0 0 10px 0;
    }
    
    .survey-header p {
      margin: 0;
      color: #666;
    }
    
    .question-card {
      margin-bottom: 20px;
    }
    
    .question-field {
      width: 100%;
    }
    
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .radio-button {
      margin-bottom: 10px;
    }
    
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .scale-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    
    .scale-labels {
      display: flex;
      justify-content: space-between;
      width: 100%;
      font-size: 12px;
      color: #666;
    }
    
    .scale-value {
      font-weight: bold;
      font-size: 18px;
      margin-top: 10px;
    }
    
    .form-actions {
      text-align: center;
      margin-top: 30px;
    }
    
    .thank-you-container {
      text-align: center;
      padding: 40px;
    }
    
    .thank-you-container h1 {
      margin-bottom: 15px;
    }
    
    .thank-you-container p {
      margin-bottom: 20px;
      color: #666;
    }
  `]
})
export class SurveyRendererComponent implements OnInit {
  survey: Survey | null = null;
  surveyForm: FormGroup;
  isSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private surveyService: SurveyService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.surveyForm = this.fb.group({});
  }

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
        if (survey.isActive) {
          this.buildForm(survey.structure);
        } else {
          // Анкета неактивна, показать сообщение
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Error loading survey', error);
        this.router.navigate(['/']);
      }
    });
  }

  private buildForm(questions: Question[]): void {
    const group = {};
    
    questions.forEach(question => {
      let validators = [];
      if (question.required) {
        validators.push(Validators.required);
      }
      
      // Добавить специфичные валидаторы для типов
      if (question.type === 'email') {
        validators.push(Validators.email);
      } else if (question.type === 'phone') {
        // Можно добавить валидатор для телефона
      }
      
      // Для чекбоксов создаем отдельную логику
      if (question.type === 'checkbox') {
        group[question.id] = this.fb.control([], Validators.requiredTrue);
      } else {
        group[question.id] = this.fb.control('', validators);
      }
    });
    
    this.surveyForm = this.fb.group(group);
  }

  getQuestionGroup(questionId: string): FormGroup {
    return this.surveyForm.get(questionId) as any;
  }

  getControl(questionId: string) {
    return this.surveyForm.get(questionId) as any;
  }

  onCheckboxChange(questionId: string, optionId: string, checked: boolean): void {
    const currentValues = this.getControl(questionId).value || [];
    let newValues: string[];
    
    if (checked) {
      newValues = [...currentValues, optionId];
    } else {
      newValues = currentValues.filter((v: string) => v !== optionId);
    }
    
    this.getControl(questionId).setValue(newValues);
  }

  getErrorMessage(question: Question): string {
    const control = this.getControl(question.id);
    
    if (control.errors?.['required']) {
      return 'Это поле обязательно для заполнения';
    }
    
    if (control.errors?.['email']) {
      return 'Введите корректный email';
    }
    
    return 'Некорректное значение';
  }

  submitSurvey(): void {
    if (this.surveyForm.valid && this.survey) {
      const submission: SurveySubmission = this.surveyForm.value;
      
      this.surveyService.submitSurvey(this.survey.id, submission).subscribe({
        next: (response) => {
          console.log('Survey submitted successfully', response);
          this.isSubmitted = true;
        },
        error: (error) => {
          console.error('Error submitting survey', error);
        }
      });
    } else {
      // Отметить все поля как touched для отображения ошибок
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.surveyForm.controls).forEach(key => {
      const control = this.surveyForm.get(key);
      control?.markAsTouched();
    });
  }

  trackByQuestionId(index: number, question: Question): string {
    return question.id;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}