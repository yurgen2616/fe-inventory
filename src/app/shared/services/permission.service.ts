import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PermissionModel } from '../models/permission-model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private baseUrl: string = 'http://localhost:8080/permissions';

  constructor(private httpClient: HttpClient) { }

  getPermissions(): Observable<PermissionModel[]> {
    return this.httpClient.get<PermissionModel[]>(this.baseUrl).pipe(
      map(res => res)
    );
  }

  getPermissionById(id: number): Observable<PermissionModel> {
    return this.httpClient.get<PermissionModel>(`${this.baseUrl}/${id}`).pipe(
      map(res => res)
    );
  }

  createPermission(permission: PermissionModel): Observable<PermissionModel> {
    return this.httpClient.post<PermissionModel>(this.baseUrl, permission).pipe(
      map(res => res)
    );
  }

  updatePermission(id: number, permission: PermissionModel): Observable<PermissionModel> {
    return this.httpClient.put<PermissionModel>(`${this.baseUrl}/${id}`, permission).pipe(
      map(res => res)
    );
  }

  deletePermission(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`).pipe(
      map(res => res)
    );
  }
}