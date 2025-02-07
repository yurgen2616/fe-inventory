import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserModel } from '../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl: string = 'http://localhost:8080/users';

  constructor(private httpClient: HttpClient) { }

  getUsers(): Observable<UserModel[]> {
    return this.httpClient.get<UserModel[]>(this.baseUrl).pipe(
      map(res => res)
    );
  }

  getUserById(id: number): Observable<UserModel> {
    return this.httpClient.get<UserModel>(`${this.baseUrl}/${id}`).pipe(
      map(res => res)
    );
  }

  createUser(user: UserModel): Observable<UserModel> {
    return this.httpClient.post<UserModel>(this.baseUrl, user).pipe(
      map(res => res)
    );
  }

  updateUser(id: number, user: UserModel): Observable<UserModel> {
    return this.httpClient.put<UserModel>(`${this.baseUrl}/${id}`, user).pipe(
      map(res => res)
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`).pipe(
      map(res => res)
    );
  }

  addRoleToUser(userId: number, roleId: number): Observable<void> {
    return this.httpClient.post<void>(`${this.baseUrl}/${userId}/roles/${roleId}`, null).pipe(
      map(res => res)
    );
  }

  removeRoleFromUser(userId: number, roleId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${userId}/roles/${roleId}`).pipe(
      map(res => res)
    );
  }
}