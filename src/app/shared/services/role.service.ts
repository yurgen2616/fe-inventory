import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoleModel } from '../models/role-model';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private baseUrl: string = 'http://localhost:8080/roles';

  constructor(private httpClient: HttpClient) { }

  getRoles(): Observable<RoleModel[]> {
    return this.httpClient.get<RoleModel[]>(this.baseUrl).pipe(
      map(res => res)
    );
  }

  getRoleById(id: number): Observable<RoleModel> {
    return this.httpClient.get<RoleModel>(`${this.baseUrl}/${id}`).pipe(
      map(res => res)
    );
  }

  createRole(role: RoleModel): Observable<RoleModel> {
    return this.httpClient.post<RoleModel>(this.baseUrl, role).pipe(
      map(res => res)
    );
  }

  updateRole(id: number, role: RoleModel): Observable<RoleModel> {
    return this.httpClient.put<RoleModel>(`${this.baseUrl}/${id}`, role).pipe(
      map(res => res)
    );
  }

  deleteRole(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`).pipe(
      map(res => res)
    );
  }

  addPermissionToRole(roleId: number, permissionId: number): Observable<void> {
    return this.httpClient.post<void>(`${this.baseUrl}/${roleId}/permissions/${permissionId}`, null).pipe(
      map(res => res)
    );
  }

  removePermissionFromRole(roleId: number, permissionId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${roleId}/permissions/${permissionId}`).pipe(
      map(res => res)
    );
  }
}