//survey.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Survey, SurveyResponse, SurveySubmission, User } from '../models/survey.model';
import { map } from 'rxjs/operators'; // ← добавь вверху файла, если ещё не импортировано

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private readonly API_URL = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) { }

  // Методы для работы с анкетами (доступны администратору и суперадминистратору)
  createSurvey(surveyData: Omit<Survey, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Observable<Survey> {
    return this.http.post<Survey>(`${this.API_URL}/surveys`, surveyData);
  }

  getSurveys(): Observable<Survey[]> {
    return this.http.get<Survey[]>(`${this.API_URL}/surveys`);
  }

  getSurvey(id: string): Observable<Survey> {
    return this.http.get<Survey>(`${this.API_URL}/surveys/${id}`);
  }

  // Публичный метод для получения анкеты (без аутентификации)
  getPublicSurvey(id: string): Observable<Survey> {
    return this.http.get<Survey>(`${this.API_URL}/surveys/f/${id}`);
  }

  updateSurvey(id: string, surveyData: Partial<Survey>): Observable<Survey> {
    return this.http.patch<Survey>(`${this.API_URL}/surveys/${id}`, surveyData);
  }

  deleteSurvey(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/surveys/${id}`);
  }

  // Метод для публичной отправки анкеты
  submitSurvey(survey_id: string, submission: SurveySubmission): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/surveys/${survey_id}/submit`, submission);
  }

  // Методы для получения ответов и статистики
getSurveyResponses(surveyId: string, params?: {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Observable<{ data: SurveyResponse[]; total: number }> {
  let queryParams = '';
  if (params) {
    const searchParams = new URLSearchParams();
    // ⚠️ Бэкенд ожидает page=1 (не page=0), иначе offset = (0-1)*20 = -20 → ошибка или пусто
    const page = params.page ?? 1;
    searchParams.set('page', page.toString());
    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    queryParams = '?' + searchParams.toString();
  }

  return this.http.get<any>(`${this.API_URL}/surveys/${surveyId}/responses${queryParams}`).pipe(
    map(response => {
      // Маппинг из snake_case → camelCase + правильная структура
      const mappedResponses: SurveyResponse[] = (response.responses || []).map((r: any) => ({
        id: r.id,
        surveyId: r.survey_id,
        data: r.data || {},
        ip: r.ip ?? undefined,
        submittedAt: r.submitted_at ?? ''
      }));

      return {
        data: mappedResponses,
        total: response.pagination?.total ?? mappedResponses.length
      };
    })
  );
}

  getSurveyStats(survey_id: string): Observable<any> {
    return this.http.get(`${this.API_URL}/surveys/${survey_id}/stats`);
  }

  // Метод для генерации QR-кода
  generateqr_code(text: string): Promise<string> {
    // Импортируем qr_code библиотеку динамически
    return import('qrCode').then((qr_code) => {
      return qr_code.toDataURL(text);
    });
  }

  // Метод для генерации QR-кода для публичной ссылки на анкету
  generateSurveyqr_code(survey_id: string): Promise<string> {
    const publicUrl = `${window.location.origin}/f/${survey_id}`;
    console.log()
    return this.generateqr_code(publicUrl);
  }

  // Методы для управления пользователями (доступны только суперадминистратору)
  createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/admin/users`, userData);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/admin/users`);
  }

  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/admin/users/${id}`, userData);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/admin/users/${id}`);
  }
}