import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SaleModel } from '../models/sale-model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  private baseUrl: string = 'http://localhost:8080/sales'; 

  constructor(private httpClient: HttpClient) { }

// En sale.service.ts
getSales(): Observable<SaleModel[]> {
  return this.httpClient.get<SaleModel[]>(this.baseUrl).pipe(
    map(res => {
      console.log('Ventas obtenidas:', res); 
      return res as SaleModel[];  // Asegúrate de que el tipo sea correcto
    }),
    catchError(error => {
      console.error('Error fetching sales:', error);
      return throwError(() => error);
    })
  );
}

  // Obtener una venta por ID
  getSaleById(id: number): Observable<SaleModel> {
    return this.httpClient.get<SaleModel>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }

  // Buscar ventas por rango de fechas
  searchSalesByDateRange(startDate: string, endDate: string): Observable<SaleModel[]> {
    return this.httpClient.get<SaleModel[]>(`${this.baseUrl}/search`, {
      params: { start: startDate, end: endDate }
    }).pipe(map(res => res));
  }

  // Crear una nueva venta
  createSale(saleDetails: any[]): Observable<SaleModel> {
    const payload = { details: saleDetails };
    
    console.log('Sending Sale Payload:', JSON.stringify(payload, null, 2));
    
    return this.httpClient.post<SaleModel>(this.baseUrl, payload).pipe(
      map(response => {
        console.log('Sale created successfully:', response);
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error al procesar la venta: ';
        
        if (error.error instanceof ErrorEvent) {
          // Error del lado del cliente
          errorMessage += 'Error de conexión. Verifique su conexión a internet.';
        } else {
          // Error del lado del servidor
          switch (error.status) {
            case 400:
              errorMessage += error.error.message || 'Datos de venta inválidos';
              break;
            case 404:
              errorMessage += 'Producto no encontrado';
              break;
            case 409:
              errorMessage += 'Stock insuficiente';
              break;
            case 500:
              errorMessage += 'Error interno del servidor';
              break;
            default:
              errorMessage += 'Error desconocido';
          }
        }

        console.error('Detailed Service Error:', {
          status: error.status,
          message: error.message,
          error: error.error,
          customMessage: errorMessage
        });
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Procesar devolución de un producto en una venta
  returnEntireSale(saleId: number): Observable<void> {
    return this.httpClient.post<void>(`${this.baseUrl}/${saleId}/return-entire`, null);
  }

  // Modify existing processReturn method to handle potential sale deletion
  processReturn(saleId: number, productId: number, quantity: number): Observable<boolean> {
    return this.httpClient.post<boolean>(`${this.baseUrl}/${saleId}/return`, null, {
      params: {
        productId: productId.toString(),
        quantity: quantity.toString()
      }
    });
  }

  // Exportar reporte de ventas
  exportSalesReport(startDate: string, endDate: string): Observable<Blob> {
    return this.httpClient.get(`${this.baseUrl}/report`, {
      params: { 
        start: startDate, 
        end: endDate 
      },
      responseType: 'blob', // Importante: especificar que es un blob
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }).pipe(
      map(blob => blob),
      catchError(error => {
        console.error('Error exporting report:', error);
        return throwError(() => new Error('Failed to export report'));
      })
    );
  }

  // Eliminar una venta por ID
  deleteSale(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${id}`).pipe(map(res => res));
  }
}
