import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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

  constructor(private http: HttpClient) {
    this.loadTranslations(this.DEFAULT_LOCALE);
  }

  /**
   * Load translations for the specified locale
   */
  loadTranslations(locale: string): Observable<Translations> {
    if (!this.SUPPORTED_LOCALES.includes(locale)) {
      console.warn(`Locale '${locale}' is not supported. Using default locale.`);
      locale = this.DEFAULT_LOCALE;
    }

    return this.http.get<Translations>(`${this.TRANSLATIONS_URL}/${locale}.json`).pipe(
      map(translations => {
        this.translations.set(translations);
        this.currentLocale.set(locale);
        return translations;
      }),
      catchError(error => {
        console.error(`Failed to load translations for locale '${locale}':`, error);
        // Return empty translations if loading fails
        this.translations.set({});
        return of({});
      })
    );
  }

  /**
   * Change the current locale and load translations
   */
  setLocale(locale: string): Observable<Translations> {
    return this.loadTranslations(locale);
  }

  /**
   * Get the current locale
   */
  getLocale(): string {
    return this.currentLocale();
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return [...this.SUPPORTED_LOCALES];
  }

  /**
   * Translate a key with optional parameters
   */
  translate(key: string, params?: { [param: string]: any }): string {
    const translation = this.getNestedTranslation(this.translations(), key);
    
    if (translation && params) {
      return this.interpolate(translation, params);
    }
    
    return translation || key;
  }

  /**
   * Get translation with parameters
   */
  t(key: string, params?: { [param: string]: any }): string {
    return this.translate(key, params);
  }

  /**
   * Get nested translation from object
   */
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

  /**
   * Interpolate parameters in translation string
   */
  private interpolate(str: string, params: { [param: string]: any }): string {
    return str.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] !== undefined ? params[param] : match;
    });
  }
}