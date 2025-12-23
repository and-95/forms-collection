import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Survey, SurveyResponse, SurveySubmission } from '../models/survey.model';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private readonly API_URL = '/api/v1';

  constructor(private http: HttpClient) { }

  // Методы для работы с анкетами (доступны администратору и суперадминистратору)
  createSurvey(surveyData: Omit<Survey, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Observable<Survey> {
    return this.http.post<Survey>(`${this.API_URL}/surveys`, surveyData);
  }

  getSurveys(): Observable<Survey[]> {
    return this.http.get<Survey[]>(`${this.API_URL}/surveys`);
  }

  getSurvey(id: string): Observable<Survey> {
    return this.http.get<Survey>(`${this.API_URL}/surveys/${id}`);
  }

  updateSurvey(id: string, surveyData: Partial<Survey>): Observable<Survey> {
    return this.http.patch<Survey>(`${this.API_URL}/surveys/${id}`, surveyData);
  }

  deleteSurvey(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/surveys/${id}`);
  }

  // Метод для публичной отправки анкеты
  submitSurvey(surveyId: string, submission: SurveySubmission): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/surveys/${surveyId}/submit`, submission);
  }

  // Методы для получения ответов и статистики
  getSurveyResponses(surveyId: string): Observable<SurveyResponse[]> {
    return this.http.get<SurveyResponse[]>(`${this.API_URL}/surveys/${surveyId}/responses`);
  }

  getSurveyStats(surveyId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/surveys/${surveyId}/stats`);
  }

  // Метод для генерации QR-кода (в реальном приложении может быть на бэкенде)
  generateQRCode(text: string): Promise<string> {
    // Импортируем qrcode библиотеку динамически
    return import('qrcode').then((QRCode) => {
      return QRCode.toDataURL(text);
    });
  }
}