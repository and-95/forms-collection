/// <reference types="./types/qrcode" />
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Survey, SurveyResponse, SurveySubmission, User } from '../models/survey.model';

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
      if (params.page !== undefined) searchParams.set('page', params.page.toString());
      if (params.limit !== undefined) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);
      queryParams = '?' + searchParams.toString();
    }
    return this.http.get<{ data: SurveyResponse[]; total: number }>(`${this.API_URL}/surveys/${surveyId}/responses${queryParams}`);
  }

  getSurveyStats(surveyId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/surveys/${surveyId}/stats`);
  }

  // Метод для генерации QR-кода
  generateQRCode(text: string): Promise<string> {
    // Импортируем qrcode библиотеку динамически
    return import('qrcode').then((QRCode) => {
      return QRCode.toDataURL(text);
    });
  }

  // Метод для генерации QR-кода для публичной ссылки на анкету
  generateSurveyQRCode(surveyId: string): Promise<string> {
    const publicUrl = `${window.location.origin}/f/${surveyId}`;
    return this.generateQRCode(publicUrl);
  }

  // Методы для управления пользователями (доступны только суперадминистратору)
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Observable<User> {
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