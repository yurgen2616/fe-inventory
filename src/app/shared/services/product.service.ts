import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductModel } from '../models/product-model';  // Asegúrate de tener el modelo de Producto en esta ruta

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private baseUrl: string = 'http://localhost:8080/products';  // URL base de tu API

  constructor(private httpClient: HttpClient) { }

  // Obtener todos los productos
  getProducts(): Observable<ProductModel[]> {
    return this.httpClient.get<ProductModel[]>(this.baseUrl).pipe(
      map(res => {
        //console.log('Productos obtenidos:', res); // Aquí se muestra la respuesta obtenida
        return res;
      })
    );
  }


  // Obtener un producto por ID
  getProductById(id: number): Observable<ProductModel> {
    return this.httpClient.get<ProductModel>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }

  // Buscar productos
  searchProducts(query: string): Observable<ProductModel[]> {
    return this.httpClient.get<ProductModel[]>(`${this.baseUrl}/search?query=${query}`).pipe(map(res => res));
  }

  // Crear un nuevo producto
  createProduct(product: ProductModel): Observable<ProductModel> {
    return this.httpClient.post<ProductModel>(this.baseUrl, product).pipe(map(res => res));
  }

  // Actualizar un producto existente
  updateProduct(id: number, product: ProductModel): Observable<ProductModel> {
    return this.httpClient.put<ProductModel>(`${this.baseUrl}/${id}`, product).pipe(map(res => res));
  }

  // Eliminar un producto
  deleteProduct(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }

  // Añadir stock a un producto
  addStock(id: number, quantity: number, unitPrice: number, unitSalePrice: number , expirationDate?: string): Observable<ProductModel> {
    const params = {
      quantity: quantity.toString(),
      unitPrice: unitPrice.toString(),
      unitSalePrice: unitSalePrice.toString(),
      expirationDate: expirationDate ?? ''
    };
    return this.httpClient.put<ProductModel>(`${this.baseUrl}/${id}/add-stock`, null, { params }).pipe(map(res => res));
  }
  // Exportar productos a Excel
exportProducts(): Observable<Blob> {
  return this.httpClient.get(`${this.baseUrl}/export`, { 
    responseType: 'blob' 
  }).pipe(
    map(res => res)
  );
}

// Agrega este método al servicio existente
getExpirationWarnings(monthsThreshold: number = 3): Observable<any[]> {
  return this.httpClient.get<any[]>(`${this.baseUrl}/expiration-warnings?monthsThreshold=${monthsThreshold}`).pipe(
    map(res => res)
  );
}
}
