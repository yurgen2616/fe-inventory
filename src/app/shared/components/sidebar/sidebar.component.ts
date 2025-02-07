import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { MenuService } from '../../services/menu.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  totalNotifications = 0;

  private permissionsSub: Subscription | null = null;

  access = {
    canGetDashboard: false,
    canGetProducts: false,
    canGetExtras: false,
    canGetSales: false,
    canGetStock: false,
    canGetReports: false,
    canGetReturns: false,
    canGetNotifications: false,
  };


  constructor(
    private sidebarService: SidebarService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private menuService:MenuService,
  ) {}

  ngOnInit() {
    this.sidebarService.isCollapsed$.subscribe(
      collapsed => this.isCollapsed = collapsed
    );
  
    // Suscribirse a las notificaciones
    this.notificationService.totalNotifications$.subscribe(
      count => this.totalNotifications = count
    );
    this.initializeAccess();

    this.permissionsSub = this.menuService.permissions$.subscribe(() => {
      this.initializeAccess();
    });
  }

  private initializeAccess(): void {
    // Use the permissions$ observable to ensure permissions are loaded
    this.menuService.permissions$.subscribe(() => {
      this.access = {
        canGetDashboard: this.menuService.hasPermission('GET /dashboard'),
        canGetProducts: this.menuService.hasPermission('GET /products'),
        canGetExtras: ['GET /categories', 'GET /roles','GET /users', 'GET /distributors', 'GET /sales-forms', 'GET /permissions'].some(permission => 
          this.menuService.hasPermission(permission)
        ),
        canGetSales: this.menuService.hasPermission('POST /sales'),
        canGetStock: this.menuService.hasPermission('PUT /products/{id}/add-stock'),
        canGetReports: this.menuService.hasPermission('GET /sales/report'),
        canGetReturns: ['POST /sales/{saleId}/return-entire', 'POST /sales/{saleId}/return'].some(permission => 
          this.menuService.hasPermission(permission)
        ),
        canGetNotifications: this.menuService.hasPermission('GET /products/expiration-warnings'),
      };
    });
  }
  

  closeSidebarOnMobile() {
    const sidebar = document.getElementById('sidebar');
    const isSmallScreen = window.innerWidth < 1280;

    if (sidebar && isSmallScreen) {
      sidebar.classList.add('-translate-x-80');
    }
  }

  toggleSidebar() {
    this.sidebarService.toggleCollapsed();
  }

  logout() {
    this.authService.logout(); // Utilizamos el método corregido del AuthService
  }

  ngOnDestroy() {
    // Prevent memory leaks
    this.permissionsSub?.unsubscribe();
  }
}
