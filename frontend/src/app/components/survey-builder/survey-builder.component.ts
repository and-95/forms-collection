// src/app/components/survey-builder/survey-builder.component.ts
import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { SurveyService } from '../../services/survey.service';
import { Survey, Question, QuestionType } from '../../models/survey.model';
import { I18nService } from '../../services/i18n.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, first } from 'rxjs'; // ✅ добавлен first

@Component({
  selector: 'app-survey-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DragDropModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="survey-builder-container">
      <!-- Лоадер при загрузке переводов -->
      <div *ngIf="!i18n.isLoaded()" class="loader">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Загрузка переводов...</p>
      </div>

      <div *ngIf="i18n.isLoaded()">
        <div class="header">
          <h1>{{ isEditMode ? i18n.t('survey.builder.title.edit') : i18n.t('survey.builder.title.create') }}</h1>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="saveSurvey()">{{ i18n.t('survey.builder.form.saveButton') }}</button>
            <button mat-button (click)="cancel()">{{ i18n.t('common.cancel') }}</button>
          </div>
        </div>

        <form [formGroup]="surveyForm">
          <div class="survey-info">
            <mat-form-field class="title-field">
              <mat-label>{{ i18n.t('survey.builder.form.titleLabel') }}</mat-label>
              <input matInput formControlName="title" placeholder="{{ i18n.t('survey.builder.form.titleLabel') }}">
              <mat-error *ngIf="surveyForm.get('title')?.hasError('required')">{{ i18n.t('common.validation.required') }}</mat-error>
              <mat-error *ngIf="surveyForm.get('title')?.hasError('minlength')">{{ i18n.t('common.validation.minLength', {min: 3}) }}</mat-error>
              <mat-error *ngIf="surveyForm.get('title')?.hasError('maxlength')">{{ i18n.t('common.validation.maxLength', {max: 100}) }}</mat-error>
            </mat-form-field>
            
            <mat-form-field class="description-field">
              <mat-label>{{ i18n.t('survey.builder.form.descriptionLabel') }}</mat-label>
              <textarea 
                matInput 
                formControlName="description" 
                placeholder="{{ i18n.t('survey.builder.form.descriptionLabel') }}"></textarea>
              <mat-error *ngIf="surveyForm.get('description')?.hasError('maxlength')">{{ i18n.t('common.validation.maxLength', {max: 500}) }}</mat-error>
            </mat-form-field>
            
            <div class="survey-options">
              <mat-slide-toggle formControlName="isAnonymous">
                {{ i18n.t('survey.builder.form.isAnonymousLabel') }}
                <mat-hint>{{ i18n.t('survey.builder.form.isAnonymousHelp') }}</mat-hint>
              </mat-slide-toggle>
              
              <mat-form-field class="expires-field">
                <mat-label>{{ i18n.t('survey.builder.form.expiresAtLabel') }}</mat-label>
                <input 
                  matInput 
                  [matDatepicker]="picker" 
                  formControlName="expiresAt"
                  placeholder="{{ i18n.t('survey.builder.form.expiresAtPlaceholder') }}">
                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-hint>{{ i18n.t('survey.builder.form.expiresAtHelp') }}</mat-hint>
              </mat-form-field>
            </div>
          </div>
          
          <div class="questions-section">
            <div class="section-header">
              <h2>{{ i18n.t('survey.builder.questions.title') }}</h2>
              <button mat-raised-button color="accent" (click)="addQuestion()">{{ i18n.t('survey.builder.questions.addQuestion') }}</button>
            </div>
            
            <div 
              cdkDropList 
              class="questions-list" 
              (cdkDropListDropped)="drop($event)">
              <div 
                class="question-item" 
                *ngFor="let question of questionsFormArray.controls; let i = index; trackBy: trackByIndex"
                cdkDrag>
                <mat-card class="question-card">
                  <mat-card-header>
                    <mat-card-title>{{ i18n.t('survey.renderer.question') }} {{ i + 1 }}</mat-card-title>
                    <mat-card-subtitle>{{ getQuestionTypeLabel(question.value.type) }}</mat-card-subtitle>
                    <button 
                      mat-icon-button 
                      class="drag-handle" 
                      cdkDragHandle
                      [matTooltip]="i18n.t('common.drag.tooltip')">
                      <mat-icon>drag_handle</mat-icon>
                    </button>
                  </mat-card-header>
                  
                  <mat-card-content>
                    <div class="question-content">
                      <mat-form-field class="question-label-field">
                        <mat-label>{{ i18n.t('survey.builder.questions.questionEditor.labelLabel') }}</mat-label>
                        <input 
                          matInput 
                          [formControl]="getFormControlAsFormControl(i, 'label')" 
                          placeholder="{{ i18n.t('survey.builder.questions.questionEditor.labelLabel') }}">
                        <mat-error *ngIf="getFormControlAsFormControl(i, 'label').hasError('required')">{{ i18n.t('common.validation.required') }}</mat-error>
                        <mat-error *ngIf="getFormControlAsFormControl(i, 'label').hasError('minlength')">{{ i18n.t('common.validation.minLength', {min: 1}) }}</mat-error>
                        <mat-error *ngIf="getFormControlAsFormControl(i, 'label').hasError('maxlength')">{{ i18n.t('common.validation.maxLength', {max: 255}) }}</mat-error>
                      </mat-form-field>
                      
                      <mat-form-field class="question-description-field">
                        <mat-label>{{ i18n.t('survey.builder.questions.questionEditor.descriptionLabel') }}</mat-label>
                        <input 
                          matInput 
                          [formControl]="getFormControlAsFormControl(i, 'description')" 
                          placeholder="{{ i18n.t('survey.builder.questions.questionEditor.descriptionLabel') }}">
                      </mat-form-field>
                      
                      <div class="question-options">
                        <mat-checkbox [formControl]="getFormControlAsFormControl(i, 'required')">
                          {{ i18n.t('survey.builder.questions.questionEditor.requiredLabel') }}
                        </mat-checkbox>
                      </div>
                      
                      <mat-form-field class="question-type-field">
                        <mat-label>{{ i18n.t('survey.builder.questions.questionEditor.typeLabel') }}</mat-label>
                        <mat-select 
                          [formControl]="getFormControlAsFormControl(i, 'type')" 
                          (selectionChange)="onQuestionTypeChange(i, $event.value)">
                          <mat-option value="text">{{ i18n.t('survey.builder.questions.questionTypes.text') }}</mat-option>
                          <mat-option value="textarea">{{ i18n.t('survey.builder.questions.questionTypes.textarea') }}</mat-option>
                          <mat-option value="radio">{{ i18n.t('survey.builder.questions.questionTypes.radio') }}</mat-option>
                          <mat-option value="select">{{ i18n.t('survey.builder.questions.questionTypes.select') }}</mat-option>
                          <mat-option value="checkbox">{{ i18n.t('survey.builder.questions.questionTypes.checkbox') }}</mat-option>
                          <mat-option value="email">{{ i18n.t('survey.builder.questions.questionTypes.email') }}</mat-option>
                          <mat-option value="phone">{{ i18n.t('survey.builder.questions.questionTypes.phone') }}</mat-option>
                          <mat-option value="date">{{ i18n.t('survey.builder.questions.questionTypes.date') }}</mat-option>
                          <mat-option value="datetime">{{ i18n.t('survey.builder.questions.questionTypes.datetime') }}</mat-option>
                          <mat-option value="scale">{{ i18n.t('survey.builder.questions.questionTypes.scale') }}</mat-option>
                        </mat-select>
                      </mat-form-field>
                      
                      <!-- Опции для вопросов с выбором -->
                      <div 
                        class="options-container" 
                        *ngIf="isChoiceQuestion(getFormControlAsFormControl(i, 'type').value)">
                        <h4>{{ i18n.t('survey.builder.questions.questionEditor.optionsLabel') }}</h4>
                        <div 
                          class="option-item" 
                          *ngFor="let option of getOptionsArray(i).controls; let j = index; trackBy: trackByIndex"
                          [formGroup]="getOptionFormGroup(i, j)">
                          <mat-form-field class="option-field">
                            <mat-label>{{ i18n.t('survey.renderer.option') }} {{ j + 1 }}</mat-label>
                            <input matInput formControlName="label" placeholder="{{ i18n.t('survey.renderer.option') }} {{ j + 1 }}">
                            <mat-error *ngIf="getOptionFormGroup(i, j).get('label')?.hasError('required')">{{ i18n.t('common.validation.required') }}</mat-error>
                            <mat-error *ngIf="getOptionFormGroup(i, j).get('label')?.hasError('minlength')">{{ i18n.t('common.validation.minLength', {min: 1}) }}</mat-error>
                          </mat-form-field>
                          <button 
                            mat-icon-button 
                            color="warn" 
                            (click)="removeOption(i, j)">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                        <button 
                          mat-button 
                          color="primary" 
                          (click)="addOption(i)">
                          {{ i18n.t('survey.builder.questions.questionEditor.addOption') }}
                        </button>
                      </div>
                      
                      <!-- Параметры шкалы -->
                      <div 
                        class="scale-options" 
                        *ngIf="getFormControlAsFormControl(i, 'type').value === 'scale'">
                        <mat-form-field class="scale-min-field">
                          <mat-label>{{ i18n.t('survey.builder.questions.questionEditor.minLabel') }}</mat-label>
                          <input 
                            type="number" 
                            matInput 
                            [formControl]="getFormControlAsFormControl(i, 'min')" 
                            value="1">
                        </mat-form-field>
                        
                        <mat-form-field class="scale-max-field">
                          <mat-label>{{ i18n.t('survey.builder.questions.questionEditor.maxLabel') }}</mat-label>
                          <input 
                            type="number" 
                            matInput 
                            [formControl]="getFormControlAsFormControl(i, 'max')" 
                            value="5">
                        </mat-form-field>
                        
                        <mat-form-field class="scale-step-field">
                          <mat-label>{{ i18n.t('survey.builder.questions.questionEditor.stepLabel') }}</mat-label>
                          <input 
                            type="number" 
                            matInput 
                            [formControl]="getFormControlAsFormControl(i, 'step')" 
                            value="1">
                        </mat-form-field>
                      </div>
                    </div>
                  </mat-card-content>
                  
                  <mat-card-actions>
                    <button 
                      mat-button 
                      color="warn" 
                      (click)="removeQuestion(i)">
                      {{ i18n.t('survey.builder.questions.questionEditor.removeQuestion') }}
                    </button>
                  </mat-card-actions>
                </mat-card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* CSS без изменений — оставляем как есть */
    .survey-builder-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #666;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .survey-info {
      margin-bottom: 30px;
    }

    .title-field, .description-field {
      width: 100%;
      margin-bottom: 15px;
    }

    .survey-options {
      display: flex;
      gap: 20px;
      align-items: end;
    }

    .expires-field {
      min-width: 200px;
    }

    .questions-section {
      margin-top: 30px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .questions-list {
      min-height: 100px;
      border: 1px dashed #ccc;
      border-radius: 4px;
      padding: 10px;
    }

    .question-item {
      margin-bottom: 15px;
    }

    .question-card {
      position: relative;
    }

    .drag-handle {
      position: absolute;
      top: 10px;
      right: 10px;
    }

    .question-content {
      padding: 15px 0;
    }

    .question-label-field, .question-description-field {
      width: 100%;
      margin-bottom: 15px;
    }

    .question-type-field {
      width: 100%;
      margin-bottom: 15px;
    }

    .question-options {
      margin-bottom: 15px;
    }

    .options-container {
      margin: 15px 0;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 4px;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .option-field {
      flex: 1;
    }

    .scale-options {
      display: flex;
      gap: 15px;
      margin: 15px 0;
    }

    .scale-min-field, .scale-max-field, .scale-step-field {
      flex: 1;
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }

      .header-actions {
        align-self: stretch;
      }

      .survey-options {
        flex-direction: column;
        align-items: stretch;
      }

      .expires-field {
        min-width: auto;
      }

      .scale-options {
        flex-direction: column;
      }
    }
  `]
})
export class SurveyBuilderComponent implements OnInit, OnDestroy {
  surveyForm: FormGroup;
  isEditMode = false;
  surveyId: string | null = null;
  currentSurvey: Survey | null = null;
  private translationSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private surveyService: SurveyService,
    private router: Router,
    private route: ActivatedRoute,
    public i18n: I18nService // ✅ используем i18n.isLoaded() напрямую
  ) {
    this.surveyForm = this.createSurveyForm();
  }

  ngOnInit(): void {
    // ✅ Загружаем переводы (если ещё не загружены) и дожидаемся завершения
    // Но так как в конструкторе I18nService уже вызван loadTranslations(),
    // достаточно просто подписаться один раз на isLoaded (через эффект или шаблон)

    // Альтернатива: дождаться первой загрузки (если нужно гарантировать)
    this.translationSub = this.i18n.loadTranslations(this.i18n.getLocale()).pipe(
      first() // ✅ отписываемся после первого значения
    ).subscribe();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.surveyId = id;
        this.loadSurvey(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.translationSub?.unsubscribe();
  }

  private createSurveyForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      isAnonymous: [false],
      expiresAt: [null],
      questions: this.fb.array([])
    });
  }

  private loadSurvey(id: string): void {
    this.surveyService.getSurvey(id).subscribe({
      next: (survey) => {
        this.currentSurvey = survey;
        this.patchSurveyForm(survey);
      },
      error: (error) => {
        console.error('Error loading survey', error);
      }
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private patchSurveyForm(survey: Survey): void {
    this.surveyForm.patchValue({
      title: survey.title,
      description: survey.description || '',
      isAnonymous: survey.isAnonymous,
      expiresAt: survey.expiresAt || null
    });

    this.questionsFormArray.clear();
    survey.structure.forEach(question => {
      this.addQuestionToForm(question);
    });
  }

  get questionsFormArray(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  addQuestion(): void {
    const newQuestion: Question = {
      id: this.generateUUID(),
      type: 'text',
      label: '',
      required: false
    };
    this.addQuestionToForm(newQuestion);
  }

  private addQuestionToForm(question: Question): void {
    const questionGroup = this.fb.group({
      id: [question.id],
      type: [question.type, Validators.required],
      label: [question.label, [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      description: [question.description || ''],
      required: [question.required],
      options: this.fb.array([]),
      min: [question.min ?? 1],
      max: [question.max ?? 5],
      step: [question.step ?? 1]
    });

    this.questionsFormArray.push(questionGroup);

    if (question.options && question.options.length > 0) {
      const optionsArray = this.getOptionsArray(this.questionsFormArray.length - 1);
      question.options.forEach(option => {
        optionsArray.push(
          this.fb.group({
            id: [option.id],
            label: [option.label, [Validators.required, Validators.minLength(1)]]
          })
        );
      });
    }
  }

  removeQuestion(index: number): void {
    this.questionsFormArray.removeAt(index);
  }

  // ✅ ТИПИЗИРОВАННЫЕ ГЕТТЕРЫ
  getQuestionFormGroup(index: number): FormGroup {
    return this.questionsFormArray.at(index) as FormGroup;
  }

  getFormControlAsFormControl(questionIndex: number, controlName: string): FormControl {
    return this.getQuestionFormGroup(questionIndex).get(controlName) as FormControl;
  }

  getOptionsArray(questionIndex: number): FormArray {
    return this.getQuestionFormGroup(questionIndex).get('options') as FormArray;
  }

  getOptionFormGroup(questionIndex: number, optionIndex: number): FormGroup {
    const optionsArray = this.getOptionsArray(questionIndex);
    return optionsArray.at(optionIndex) as FormGroup;
  }

  addOption(questionIndex: number): void {
    const optionsArray = this.getOptionsArray(questionIndex);
    optionsArray.push(
      this.fb.group({
        id: [this.generateUUID()],
        label: ['', [Validators.required, Validators.minLength(1)]]
      })
    );
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const optionsArray = this.getOptionsArray(questionIndex);
    optionsArray.removeAt(optionIndex);
  }

  onQuestionTypeChange(questionIndex: number, newType: QuestionType): void {
    if (!this.isChoiceQuestion(newType)) {
      this.getOptionsArray(questionIndex).clear();
    }
  }

  isChoiceQuestion(type: QuestionType): boolean {
    return ['radio', 'select', 'checkbox'].includes(type);
  }

  getQuestionTypeLabel(type: QuestionType): string {
    const labels: Record<QuestionType, string> = {
      text: this.i18n.t('survey.builder.questions.questionTypes.text'),
      textarea: this.i18n.t('survey.builder.questions.questionTypes.textarea'),
      radio: this.i18n.t('survey.builder.questions.questionTypes.radio'),
      select: this.i18n.t('survey.builder.questions.questionTypes.select'),
      checkbox: this.i18n.t('survey.builder.questions.questionTypes.checkbox'),
      email: this.i18n.t('survey.builder.questions.questionTypes.email'),
      phone: this.i18n.t('survey.builder.questions.questionTypes.phone'),
      date: this.i18n.t('survey.builder.questions.questionTypes.date'),
      datetime: this.i18n.t('survey.builder.questions.questionTypes.datetime'),
      scale: this.i18n.t('survey.builder.questions.questionTypes.scale')
    };
    return labels[type] || type;
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.questionsFormArray.controls, event.previousIndex, event.currentIndex);
  }

  trackByIndex(index: number): number {
    return index;
  }

  saveSurvey(): void {
    if (this.surveyForm.valid) {
      const formData = this.surveyForm.value;
      const surveyData: Omit<Survey, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'> = {
        title: formData.title,
        description: formData.description,
        structure: this.convertFormToStructure(formData.questions),
        expiresAt: formData.expiresAt || null,
        isAnonymous: formData.isAnonymous,
        isActive: true
      };

      const action$ = this.isEditMode && this.surveyId
        ? this.surveyService.updateSurvey(this.surveyId, surveyData)
        : this.surveyService.createSurvey(surveyData);

      action$.subscribe({
        next: (survey) => {
          console.log(`${this.isEditMode ? 'Survey updated' : 'Survey created'} successfully`, survey);
          this.router.navigate(['/surveys']);
        },
        error: (error) => {
          console.error(`Error ${this.isEditMode ? 'updating' : 'creating'} survey`, error);
          alert(`Ошибка: ${error?.error?.message || 'Не удалось сохранить анкету'}`);
        }
      });
    } else {
      this.markFormGroupTouched();
      console.warn('Form is invalid', this.surveyForm.errors);
    }
  }

  private markFormGroupTouched(): void {
    this.markFormGroupTouchedRecursive(this.surveyForm);
  }

  private markFormGroupTouchedRecursive(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouchedRecursive(control);
      }
    });
  }

  private convertFormToStructure(questions: any[]): Question[] {
    return questions.map(q => ({
      id: q.id,
      type: q.type,
      label: q.label,
      description: q.description || undefined,
      required: q.required,
      options: this.isChoiceQuestion(q.type) ? q.options : undefined,
      min: q.type === 'scale' ? q.min : undefined,
      max: q.type === 'scale' ? q.max : undefined,
      step: q.type === 'scale' ? q.step : undefined
    }));
  }

  cancel(): void {
    this.router.navigate(['/surveys']);
  }
}