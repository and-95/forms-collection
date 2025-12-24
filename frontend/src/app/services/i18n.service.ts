// src/app/services/i18n.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

export interface Translations {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly TRANSLATIONS_URL = 'assets/i18n';
  private readonly DEFAULT_LOCALE = 'ru';
  private readonly SUPPORTED_LOCALES = ['ru'];

  currentLocale = signal(this.DEFAULT_LOCALE);
  private translations = signal<Translations>({});
  private loading = signal<boolean>(true); // ✅ добавлено

  // ✅ Новый сигнал: загружены ли переводы
  isLoaded = computed(() => !this.loading()); // true — когда загружено
  translationsLoaded$ = new Observable<boolean>(subscriber => {
    const effect = () => {
      subscriber.next(this.isLoaded());
    };
    const interval = setInterval(effect, 0); // для обратной совместимости с Observable
    effect();
    return () => clearInterval(interval);
  });

  constructor(private http: HttpClient) {
    this.loadTranslations(this.DEFAULT_LOCALE).subscribe();
  }

  loadTranslations(locale: string): Observable<Translations> {
    if (!this.SUPPORTED_LOCALES.includes(locale)) {
      console.warn(`Locale '${locale}' is not supported. Using default locale.`);
      locale = this.DEFAULT_LOCALE;
    }

    this.loading.set(true); // ✅ начали загрузку

    return this.http.get<Translations>(`${this.TRANSLATIONS_URL}/${locale}.json`).pipe(
      tap(() => this.loading.set(false)), // ✅ загрузка завершена
      map(translations => {
        this.translations.set(translations);
        this.currentLocale.set(locale);
        return translations;
      }),
      catchError(error => {
        console.error(`Failed to load translations for locale '${locale}':`, error);
        this.translations.set({});
        this.loading.set(false); // ✅ даже при ошибке — загрузка "закончена"
        return of({});
      })
    );
  }

  setLocale(locale: string): Observable<Translations> {
    return this.loadTranslations(locale);
  }

  getLocale(): string {
    return this.currentLocale();
  }

  getSupportedLocales(): string[] {
    return [...this.SUPPORTED_LOCALES];
  }

  translate(key: string, params?: { [param: string]: any }): string {
    const translation = this.getNestedTranslation(this.translations(), key);
    if (translation && params) {
      return this.interpolate(translation, params);
    }
    return translation || key;
  }

  t(key: string, params?: { [param: string]: any }): string {
    return this.translate(key, params);
  }

  private getNestedTranslation(obj: Translations, path: string): string | undefined {
    const keys = path.split('.');
    let result: any = obj;
    for (const key of keys) {
      if (result && typeof result === 'object') {
        result = result[key];
      } else {
        return undefined;
      }
    }
    return typeof result === 'string' ? result : undefined;
  }

  private interpolate(str: string, params: { [param: string]: any }): string {
    return str.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? String(params[param]) : match;
    });
  }
}