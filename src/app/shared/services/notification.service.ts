import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private totalNotifications = new BehaviorSubject<number>(0);
  totalNotifications$ = this.totalNotifications.asObservable();

  constructor(private productService: ProductService) {
    this.loadInitialNotifications();
  }

  updateTotalNotifications(count: number) {
    this.totalNotifications.next(count);
  }

  private loadInitialNotifications() {
    this.productService.getExpirationWarnings().subscribe({
      next: (warnings) => {
        const lowStockWarnings = warnings.filter(w => w.type === 'LOW_STOCK');
        const expirationWarnings = warnings.filter(w =>
          w.type === 'EXPIRING_BATCH' || w.type === 'EXPIRING_PRODUCT'
        );
        const totalNotifications = lowStockWarnings.length + expirationWarnings.length;

        this.updateTotalNotifications(totalNotifications);
      },
      error: (err) => {
        console.error('Error al cargar las notificaciones iniciales', err);
      }
    });
  }
}
