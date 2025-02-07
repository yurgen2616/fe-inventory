import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SalesFormModel } from '../models/salesForm-model';  // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class SalesFormService {

  private baseUrl: string = 'http://localhost:8080/sales-forms';  // URL base de la API de formularios de venta

  constructor(private httpClient: HttpClient) { }

  // Obtener todos los formularios de ventas
  getSalesForms(): Observable<SalesFormModel[]> {
    return this.httpClient.get<SalesFormModel[]>(this.baseUrl).pipe(map(res => res));
  }

  // Obtener un formulario de venta por ID
  getSalesFormById(id: number): Observable<SalesFormModel> {
    return this.httpClient.get<SalesFormModel>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }

  // Crear un nuevo formulario de venta
  saveSalesForm(salesForm: SalesFormModel): Observable<SalesFormModel> {
    return this.httpClient.post<SalesFormModel>(this.baseUrl, salesForm).pipe(map(res => res));
  }

  // Actualizar un formulario de venta existente
  updateSalesForm(id: number, salesForm: SalesFormModel): Observable<SalesFormModel> {
    return this.httpClient.put<SalesFormModel>(`${this.baseUrl}/${id}`, salesForm).pipe(map(res => res));
  }

  // Eliminar un formulario de venta
  deleteSalesForm(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }
}
