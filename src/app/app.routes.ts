import { Routes } from '@angular/router';
import { AuthGuard } from './shared/services/guards/auth.guard';
import { authenticatedGuard } from './shared/services/guards/authenticated.guard';

export const routes: Routes = [

  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component'),

    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./business/dashboard/dashboard.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'product',
        loadComponent: () => import('./business/product/product.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'extras',
        loadComponent: () => import('./business/extras/extras.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'category',
        loadComponent: () => import('./business/category/category.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'distributor',
        loadComponent: () => import('./business/distributor/distributor.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'salesForm',
        loadComponent: () => import('./business/sales-form/sales-form.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'sale',
        loadComponent: () => import('./business/sale/sale.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'stock',
        loadComponent: () => import('./business/stock/stock.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'reportes',
        loadComponent: () => import('./business/sale-report/sale-report.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'return',
        loadComponent: () => import('./business/sale-return/sale-return.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'notifications',
        loadComponent: () => import('./business/product-notification/product-notification.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'user',
        loadComponent: () => import('./business/user/user.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'role',
        loadComponent: () => import('./business/role/role.component'),
        canActivate: [AuthGuard]
      },
      {
        path: 'permission',
        loadComponent: () => import('./business/permission/permission.component'),
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./business/authentication/login/login.component'),
    canActivate: [authenticatedGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }

];
