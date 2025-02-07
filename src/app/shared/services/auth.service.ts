import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { MenuService } from './menu.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private LOGIN_URL = 'http://localhost:8080/login';
  private tokenKey = 'authToken';
  private memoryToken: string | null = null;
  private isBrowser: boolean;

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private menuService : MenuService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  login(username: string, password: string): Observable<any> {
    return this.httpClient.post<any>(this.LOGIN_URL, { username, password }).pipe(
      tap({
        next: (response) => {
          if (response.token) {
            this.setToken(response.token);
            this.menuService.loadPermissions().subscribe();
          }
        }
      }),
      catchError(this.handleError)
    );
  }
  
  // Add a new method to reload permissions
  reloadPermissions(): Observable<string[]> {
    return this.menuService.loadPermissions();
  }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      return throwError(() => new Error('No autorizado'));
    } else if (error.status === 403) {
      return throwError(() => new Error('Acceso denegado'));
    }
    return throwError(() => new Error('Ocurrió un error. Por favor intente nuevamente'));
  }

  // Método modificado con métodos HTTP específicos para evitar problemas de tipo
  get<T>(url: string): Observable<T> {
    return this.httpClient.get<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.httpClient.post<T>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.httpClient.put<T>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(url: string): Observable<T> {
    return this.httpClient.delete<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  setToken(token: string): void {
    this.memoryToken = token;
    if (this.isBrowser) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(this.tokenKey) : this.memoryToken;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      return Date.now() < payload.exp * 1000;
    } catch {
      return false;
    }
  }

  logout(): void {
    this.memoryToken = null;
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      this.menuService.clearPermissions();
    }
    this.router.navigate(['/login']);
  }
}