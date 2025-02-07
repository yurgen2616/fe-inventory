import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryModel } from '../models/category-model';  // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private baseUrl: string = 'http://localhost:8080/categories';  // URL base de la API de categorías

  constructor(private httpClient: HttpClient) { }

  // Obtener todas las categorías
  getCategories(): Observable<CategoryModel[]> {
    return this.httpClient.get<CategoryModel[]>(this.baseUrl).pipe(map(res => res));
  }

  // Obtener una categoría por ID
  getCategoryById(id: number): Observable<CategoryModel> {
    return this.httpClient.get<CategoryModel>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }

  // Crear una nueva categoría
  saveCategory(category: CategoryModel): Observable<CategoryModel> {
    return this.httpClient.post<CategoryModel>(this.baseUrl, category).pipe(map(res => res));
  }

  // Actualizar una categoría existente
  updateCategory(id: number, category: CategoryModel): Observable<CategoryModel> {
    return this.httpClient.put<CategoryModel>(`${this.baseUrl}/${id}`, category).pipe(map(res => res));
  }

  // Eliminar una categoría
  deleteCategory(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }
}
