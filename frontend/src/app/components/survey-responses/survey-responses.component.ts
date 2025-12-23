import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { SurveyService } from '../../services/survey.service';
import { Survey, Question } from '../../models/survey.model';
import { CommonModule, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-survey-responses',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    NgFor,
    NgIf
  ],
  template: `
    <div class="responses-container">
      <div class="header">
        <h1>Ответы по анкете: {{ survey?.title }}</h1>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="exportResponses()">
            <mat-icon>download</mat-icon>
            Экспорт
          </button>
        </div>
      </div>
      
      <mat-card class="filters-card">
        <div class="filters">
          <mat-form-field>
            <mat-label>Поиск</mat-label>
            <input matInput (input)="applyFilter($event)" placeholder="Поиск по ответам...">
          </mat-form-field>
          
          <mat-form-field>
            <mat-label>Фильтр по дате</mat-label>
            <input 
              matInput 
              [matDatepicker]="datePicker" 
              placeholder="Выберите диапазон дат"
              (dateChange)="onDateFilterChange($event)">
            <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
            <mat-datepicker #datePicker></mat-datepicker>
          </mat-form-field>
          
          <mat-form-field>
            <mat-label>Размер страницы</mat-label>
            <mat-select [value]="pageSize" (selectionChange)="onPageSizeChange($event.value)">
              <mat-option [value]="20">20</mat-option>
              <mat-option [value]="50">50</mat-option>
              <mat-option [value]="100">100</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>
      
      <mat-card class="responses-table-card">
        <div class="table-container">
          <table mat-table [dataSource]="displayedResponses" class="mat-elevation-z8" matSort>
            <!-- Column definitions will be generated dynamically -->
            <ng-container *ngFor="let columnDef of displayedColumns; let i = index" [matColumnDef]="columnDef">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ columnDef }}</th>
              <td mat-cell *matCellDef="let element">{{ element[columnDef] }}</td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
        
        <mat-paginator
          [length]="totalItems"
          [pageSize]="pageSize"
          [pageSizeOptions]="[20, 50, 100]"
          (page)="onPageChange($event)"
          aria-label="Выберите страницу">
        </mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .responses-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
    
    .filters-card {
      margin-bottom: 20px;
      padding: 15px;
    }
    
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      align-items: end;
    }
    
    .filters mat-form-field {
      min-width: 200px;
    }
    
    .responses-table-card {
      overflow-x: auto;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
    }
    
    .mat-mdc-row .mat-mdc-cell {
      word-break: break-word;
    }
    
    @media (max-width: 768px) {
      .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }
      
      .filters {
        flex-direction: column;
        align-items: stretch;
      }
      
      .filters mat-form-field {
        min-width: auto;
      }
    }
  `]
})
export class SurveyResponsesComponent implements OnInit {
  survey: Survey | null = null;
  responses: any[] = [];
  displayedResponses: any[] = [];
  displayedColumns: string[] = [];
  allColumns: string[] = [];
  filterValue = '';
  dateFilter: Date | null = null;
  pageSize = 20;
  pageIndex = 0;
  totalItems = 0;
  loading = false;

  constructor(
    private surveyService: SurveyService,
    private route: ActivatedRoute
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
        this.loadResponses(id);
      },
      error: (error) => {
        console.error('Error loading survey', error);
      }
    });
  }

  private loadResponses(surveyId: string): void {
    this.loading = true;
    
    this.surveyService.getSurveyResponses(surveyId, {
      page: this.pageIndex,
      limit: this.pageSize,
      search: this.filterValue,
      dateFrom: this.dateFilter ? this.dateFilter.toISOString() : undefined
    }).subscribe({
      next: (response) => {
        this.responses = response.data || [];
        this.totalItems = response.total || this.responses.length;
        this.generateColumns();
        this.updateDisplayedResponses();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading responses', error);
        this.loading = false;
      }
    });
  }

  private generateColumns(): void {
    // Определяем колонки на основе структуры анкеты
    this.allColumns = ['submittedAt'];
    
    if (this.survey) {
      this.survey.structure.forEach((question: Question) => {
        this.allColumns.push(question.label);
      });
    }
    
    this.displayedColumns = [...this.allColumns];
  }

  private updateDisplayedResponses(): void {
    // Преобразуем ответы в формат, подходящий для отображения в таблице
    this.displayedResponses = this.responses.map(response => {
      const row: any = {
        submittedAt: new Date(response.submittedAt).toLocaleString()
      };
      
      if (this.survey) {
        // Добавляем ответы на вопросы
        this.survey.structure.forEach((question: Question) => {
          const answer = response.data[question.id];
          
          if (Array.isArray(answer)) {
            // Для чекбоксов - объединяем ответы
            row[question.label] = answer.join(', ');
          } else if (typeof answer === 'object' && answer !== null) {
            // Обработка других типов объектов
            row[question.label] = JSON.stringify(answer);
          } else {
            // Для остальных типов
            row[question.label] = answer || 'Не отвечено';
          }
        });
      }
      
      return row;
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValue = filterValue.trim().toLowerCase();
    this.pageIndex = 0; // Сброс к первой странице при фильтрации
    this.loadResponses(this.survey!.id);
  }

  onDateFilterChange(event: any): void {
    this.dateFilter = event.value;
    this.pageIndex = 0; // Сброс к первой странице при фильтрации по дате
    this.loadResponses(this.survey!.id);
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.pageIndex = 0; // Сброс к первой странице при изменении размера страницы
    this.loadResponses(this.survey!.id);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadResponses(this.survey!.id);
  }

  exportResponses(): void {
    // В реальном приложении здесь будет реализация экспорта
    console.log('Exporting responses...');
  }
}