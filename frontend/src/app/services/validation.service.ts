import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { switchMap, catchError, map, forkJoin } from 'rxjs/operators';
import { I18nService } from './i18n.service';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  constructor(private i18n: I18nService) {}

  // Password validation requirements
  static readonly PASSWORD_REQUIREMENTS = {
    minLength: 8,
    hasUpperCase: true,
    hasLowerCase: true,
    hasNumbers: true,
    hasSpecialChars: true,
    specialChars: /[!@#$%^&*]/,
  };

  // Custom validators
  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }

      const value = control.value as string;
      const errors: ValidationErrors = {};

      // Check minimum length
      if (value.length < ValidationService.PASSWORD_REQUIREMENTS.minLength) {
        errors['minLength'] = { 
          required: ValidationService.PASSWORD_REQUIREMENTS.minLength, 
          actual: value.length 
        };
      }

      // Check for uppercase letter
      if (ValidationService.PASSWORD_REQUIREMENTS.hasUpperCase && !/[A-Z]/.test(value)) {
        errors['requireUppercase'] = true;
      }

      // Check for lowercase letter
      if (ValidationService.PASSWORD_REQUIREMENTS.hasLowerCase && !/[a-z]/.test(value)) {
        errors['requireLowercase'] = true;
      }

      // Check for numbers
      if (ValidationService.PASSWORD_REQUIREMENTS.hasNumbers && !/\d/.test(value)) {
        errors['requireNumbers'] = true;
      }

      // Check for special characters
      if (ValidationService.PASSWORD_REQUIREMENTS.hasSpecialChars && 
          !ValidationService.PASSWORD_REQUIREMENTS.specialChars.test(value)) {
        errors['requireSpecialChars'] = true;
      }

      return Object.keys(errors).length ? errors : null;
    };
  }

  // Phone number validator
  phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }

      const phoneRegex = /^(\+7|8)[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
      const isValid = phoneRegex.test(control.value);
      return isValid ? null : { phone: { value: control.value } };
    };
  }

  // Custom email validator (enhanced)
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValid = emailRegex.test(control.value);
      return isValid ? null : { email: { value: control.value } };
    };
  }

  // Scale range validator
  scaleRangeValidator(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined) {
        return null; // Don't validate empty values
      }

      const value = Number(control.value);
      if (isNaN(value)) {
        return { scaleInvalid: { value: control.value } };
      }

      const isValid = value >= min && value <= max;
      return isValid ? null : { 
        scaleRange: { 
          min: min, 
          max: max, 
          actual: value 
        } 
      };
    };
  }

  // Date range validator
  dateRangeValidator(minDate?: Date, maxDate?: Date): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null; // Don't validate empty values
      }

      const dateValue = new Date(control.value);
      if (isNaN(dateValue.getTime())) {
        return { dateInvalid: { value: control.value } };
      }

      let errors: ValidationErrors | null = null;

      if (minDate && dateValue < minDate) {
        errors = { dateMin: { min: minDate, actual: dateValue } };
      }

      if (maxDate && dateValue > maxDate) {
        errors = { dateMax: { max: maxDate, actual: dateValue } };
      }

      return errors;
    };
  }

  // Async validators can be used for server-side validation
  uniqueValidator(
    checkFn: (value: any) => Observable<boolean>,
    errorKey: string = 'unique'
  ): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null); // Don't validate empty values
      }

      return timer(300).pipe( // Debounce for 300ms
        switchMap(() => checkFn(control.value)),
        map(isUnique => isUnique ? null : { [errorKey]: { value: control.value } }),
        catchError(() => of(null)) // Return null on error to avoid validation failure
      );
    };
  }
}

// Helper function to combine multiple validators
export function combineValidators(validators: ValidatorFn[]): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    for (const validator of validators) {
      const result = validator(control);
      if (result !== null) {
        return result;
      }
    }
    return null;
  };
}

// Helper function to combine multiple async validators
export function combineAsyncValidators(validators: AsyncValidatorFn[]): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const observables = validators.map(validator => validator(control));
    
    return forkJoin(observables).pipe(
      map(results => {
        const errors = results.filter(result => result !== null);
        return errors.length > 0 ? Object.assign({}, ...errors) : null;
      })
    );
  };
}