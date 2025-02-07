import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../shared/services/product.service';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { NotificationService } from '../../shared/services/notification.service';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-product-notification',
  imports: [NgClass,NgFor,NgIf,CommonModule],
  templateUrl: './product-notification.component.html',
  styleUrl: './product-notification.component.css'
})
export default class ProductNotificationComponent implements OnInit {

  lowStockWarnings: any[] = [];
  expirationWarnings: any[] = [];

  access = {
    canWarnExpiration: false,
  };

  constructor(private productService: ProductService,private notificationService: NotificationService, private menuService:MenuService) {}

  ngOnInit() {
    this.loadWarnings();
    this.initializeAccess();
  }

  private initializeAccess(): void {
    this.access = {
      canWarnExpiration: this.menuService.hasPermission('GET /products/expiration-warnings'),
    };
  }

  loadWarnings() {
    this.productService.getExpirationWarnings().subscribe({
      next: (warnings) => {
        this.lowStockWarnings = warnings.filter(w => w.type === 'LOW_STOCK');
        this.expirationWarnings = warnings.filter(w => 
          w.type === 'EXPIRING_BATCH' || w.type === 'EXPIRING_PRODUCT'
        );
        // Update total notifications count
        const totalNotifications = this.lowStockWarnings.length + this.expirationWarnings.length;
        this.notificationService.updateTotalNotifications(totalNotifications);
      },
      error: (err) => {
        console.error('Error al cargar advertencias', err);
      }
    });
  }
}
