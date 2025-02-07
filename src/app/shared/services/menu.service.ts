import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Client, Message } from '@stomp/stompjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly API_URL = 'http://localhost:8080/menu';
  private readonly WS_URL = 'ws://localhost:8080/ws';

  private permissionsSubject = new BehaviorSubject<string[]>([]);
  permissions$ = this.permissionsSubject.asObservable();

  private stompClient: Client | null = null;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.initWebSocket();
    }
  }

  private initWebSocket() {
    this.stompClient = new Client({
      brokerURL: this.WS_URL,
      onConnect: () => {
        this.stompClient?.subscribe('/topic/permissions-update', 
          (message: Message) => {
            const username = message.body;
            this.loadPermissions().subscribe();
          }
        );
      }
    });

    this.stompClient.activate();
  }

  loadPermissions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.API_URL}/access`).pipe(
      tap(permissions => this.permissionsSubject.next(permissions))
    );
  }

  hasPermission(permission: string): boolean {
    return this.permissionsSubject.value.includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  clearPermissions(): void {
    this.permissionsSubject.next([]);
  }
}