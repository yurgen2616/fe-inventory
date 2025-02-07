import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-extras',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './extras.component.html',
  styleUrl: './extras.component.css'
})
export default class ExtrasComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private menuService = inject(MenuService);
  
  menuItems = [
    {
      title: 'Categorias',
      route: '/category',
      image: 'assets/images/category.png',
      permission: 'GET /categories'
    },
    {
      title: 'Distribuidores',
      route: '/distributor',
      image: 'assets/images/distributor.png',
      permission: 'GET /distributors'
    },
    {
      title: 'Formas de Venta',
      route: '/salesForm',
      image: 'assets/images/saleform.png',
      permission: 'GET /sales-forms'
    },
    {
      title: 'Usuarios',
      route: '/user',
      image: 'assets/images/users.png',
      permission: 'GET /users'
    },
    {
      title: 'Roles',
      route: '/role',
      image: 'assets/images/roles.png',
      permission: 'GET /roles'
    },
    {
      title: 'Permisos',
      route: '/permission',
      image: 'assets/images/permissions.png',
      permission: 'GET /permissions'
    }
  ];

  ngOnInit() {
    // Filter menu items based on permissions
    this.menuItems = this.menuItems.filter(item => 
      this.menuService.hasPermission(item.permission)
    );

    if (isPlatformBrowser(this.platformId)) {
      this.menuItems = this.menuItems.map(item => ({
        ...item,
        image: `${window.location.origin}/${item.image}`
      }));
    }
  }
}