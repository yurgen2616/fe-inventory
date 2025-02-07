import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
  totalNotifications = 0;
  currentPath: string[] = [];
  
  // Mapa de traducciones de rutas
  private routeTranslations: { [key: string]: string } = {
    'dashboard': 'inicio',
    'product': 'productos',
    'extras': 'extras',
    'category': 'categorías',
    'distributor': 'distribuidores',
    'salesForm': 'formulario de ventas',
    'sale': 'ventas',
    'stock': 'stock',
    'reportes': 'reportes',
    'return': 'devoluciones',
    'notifications': 'notificaciones',
    'user': 'usuarios',
    'role': 'roles',
    'permission': 'permisos'
  };

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService
  ) {
    // Suscribirse a los cambios de ruta
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Obtener la ruta actual y dividirla en segmentos
      const currentUrl = this.router.url.split('/').filter(segment => segment);
      this.currentPath = currentUrl;
    });
  }

  ngOnInit() {
    this.notificationService.totalNotifications$.subscribe(
      count => this.totalNotifications = count
    );
  }

  // Función para traducir y capitalizar la ruta
  capitalize(str: string): string {
    const translated = this.routeTranslations[str.toLowerCase()] || str;
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('-translate-x-80');
    }
  }

  logout() {
    this.authService.logout();
  }
}