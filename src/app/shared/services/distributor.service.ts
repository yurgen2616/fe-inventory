import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DistributorModel } from '../models/distributor-models';  // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class DistributorService {

  private baseUrl: string = 'http://localhost:8080/distributors';  // URL base de la API de distribuidores

  constructor(private httpClient: HttpClient) { }

  // Obtener todos los distribuidores
  getDistributors(): Observable<DistributorModel[]> {
    return this.httpClient.get<DistributorModel[]>(this.baseUrl).pipe(map(res => res));
  }

  // Obtener un distribuidor por ID
  getDistributorById(id: number): Observable<DistributorModel> {
    return this.httpClient.get<DistributorModel>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }

  // Crear un nuevo distribuidor
  saveDistributor(distributor: DistributorModel): Observable<DistributorModel> {
    return this.httpClient.post<DistributorModel>(this.baseUrl, distributor).pipe(map(res => res));
  }

  // Actualizar un distribuidor existente
  updateDistributor(id: number, distributor: DistributorModel): Observable<DistributorModel> {
    return this.httpClient.put<DistributorModel>(`${this.baseUrl}/${id}`, distributor).pipe(map(res => res));
  }

  // Eliminar un distribuidor
  deleteDistributor(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }
}
