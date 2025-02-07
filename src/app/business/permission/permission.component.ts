import { Component, OnInit } from '@angular/core';
import { RoleModel } from '../../shared/models/role-model';
import { PermissionModel } from '../../shared/models/permission-model';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleService } from '../../shared/services/role.service';
import { PermissionService } from '../../shared/services/permission.service';
import { NgFor, NgIf } from '@angular/common';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';
import { HighlightPipe } from '../../shared/pipe/highlight.pipe';
import { MenuService } from '../../shared/services/menu.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-permission',
  imports: [NgFor, NgIf, FormsModule, ReactiveFormsModule,HighlightPipe],
  templateUrl: './permission.component.html',
  styleUrl: './permission.component.css'
})
export default class PermissionComponent implements OnInit {
  roles: RoleModel[] = [];
  permissions: PermissionModel[] = [];
  filteredPermissions: PermissionModel[] = [];
  paginatedPermissions: PermissionModel[] = [];
  selectedPermissions: Set<number> = new Set();
  showPermissions: boolean = false;
  
  currentPage: number = 1;
  rowsPerPage: number = 5;
  searchTerm: string = '';
  Math = Math;

  access = {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canReadOne: false,
    canExport:false,
    canAssignRole: false,
    canDeleteRole: false
  };

  roleForm = new FormGroup({
    roleId: new FormControl('', [Validators.required])
  });

  constructor(
    private roleService: RoleService,
    private permissionService: PermissionService,
    private location: Location,
    private menuService:MenuService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadRoles();
    this.initializeAccess();
  }

  private initializeAccess(): void {
    this.access = {
      canCreate: this.menuService.hasPermission('POST /permissions'),
      canRead: this.menuService.hasPermission('GET /permissions'),
      canUpdate: this.menuService.hasPermission('PUT /permissions/{id}'),
      canDelete: this.menuService.hasPermission('DELETE /permissions/{id}'),
      canReadOne: this.menuService.hasPermission('GET /permissions/{id}'),
      canExport: this.menuService.hasPermission('GET /permissions/export'),
      canAssignRole: this.menuService.hasPermission('POST /roles/{roleId}/permissions/{permissionId}'),
      canDeleteRole: this.menuService.hasPermission('DELETE /roles/{roleId}/permissions/{permissionId}'),
    };
  }

  goBack(): void {
    this.location.back();
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        // Modificamos los nombres de los roles para mostrar
        this.roles = roles.map(role => ({
          ...role,
          name: role.name.replace('ROLE_', '')
        }));
      },
      error: () => {
        this.showError('Error al cargar los roles');
      }
    });
  }

  loadPermissions() {
    if (this.roleForm.invalid) return;

    const roleId = Number(this.roleForm.get('roleId')?.value);
    
    Promise.all([
      this.permissionService.getPermissions().toPromise(),
      this.roleService.getRoleById(roleId).toPromise()
    ]).then(([allPermissions, role]) => {
      this.permissions = allPermissions || [];
      this.selectedPermissions = new Set(role?.permissions.map(p => p.id) || []);
      this.showPermissions = true;
      this.filteredPermissions = this.getFilteredPermissions();
      this.updatePagination();
    }).catch(() => {
      this.showError('Error al cargar los permisos');
    });
  }

  getFilteredPermissions(): PermissionModel[] {
    if (!this.searchTerm.trim()) {
      return [...this.permissions];
    }
    return this.permissions.filter(permission =>
      permission.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  get filteredResults(): PermissionModel[] {
    return this.filteredPermissions;
  }

  updatePagination() {
    this.filteredPermissions = this.getFilteredPermissions();
    const totalItems = this.filteredPermissions.length;
    const totalPages = Math.ceil(totalItems / this.rowsPerPage);
    
    // Ajustar la página actual si es necesario
    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    // Calcular índices de inicio y fin
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = Math.min(startIndex + this.rowsPerPage, totalItems);
    
    // Asegurarse de que paginatedPermissions siempre tenga el tamaño correcto
    this.paginatedPermissions = this.filteredPermissions.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    const totalPages = Math.ceil(this.filteredPermissions.length / this.rowsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  changeRowsPerPage(rows: number) {
    this.rowsPerPage = Number(rows);
    this.currentPage = 1;
    this.updatePagination();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.filteredPermissions = this.getFilteredPermissions();
    this.updatePagination();
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.filteredPermissions = this.getFilteredPermissions();
    this.updatePagination();
  }

  isPermissionSelected(permission: PermissionModel): boolean {
    return this.selectedPermissions.has(permission.id);
  }

  togglePermission(permission: PermissionModel) {
    if (this.selectedPermissions.has(permission.id)) {
      this.selectedPermissions.delete(permission.id);
    } else {
      this.selectedPermissions.add(permission.id);
    }
  }

  areAllPermissionsSelected(): boolean {
    return this.permissions.length > 0 && this.selectedPermissions.size === this.permissions.length;
  }
  
  toggleAllPermissions(): void {
    if (this.areAllPermissionsSelected()) {
      this.selectedPermissions.clear();
    } else {
      this.permissions.forEach(permission => {
        this.selectedPermissions.add(permission.id);
      });
    }
  }

  async savePermissions() {
    const roleId = Number(this.roleForm.get('roleId')?.value);
    const role = await this.roleService.getRoleById(roleId).toPromise();
    
    if (!role) return;

    const currentPermissions = new Set(role.permissions.map(p => p.id));
    
    const toAdd = [...this.selectedPermissions].filter(id => !currentPermissions.has(id));
    const toRemove = [...currentPermissions].filter(id => !this.selectedPermissions.has(id));

    try {
      await Promise.all([
        ...toAdd.map(permId => this.roleService.addPermissionToRole(roleId, permId).toPromise()),
        ...toRemove.map(permId => this.roleService.removePermissionFromRole(roleId, permId).toPromise())
      ]);

      this.authService.reloadPermissions().subscribe();

      Swal.fire({
        icon: 'success',
        title: 'Permisos actualizados con éxito',
        showConfirmButton: false,
        timer: 1500
      });
      
      this.cancelEdit();
    } catch (error) {
      this.showError('Error al actualizar los permisos');
    }
  }

  cancelEdit() {
    this.showPermissions = false;
    this.selectedPermissions.clear();
    this.roleForm.reset();
    this.currentPage = 1;
    this.rowsPerPage = 5;
    this.searchTerm = '';
    this.filteredPermissions = [];
    this.paginatedPermissions = [];
  }

  private showError(message: string) {
    Swal.fire({
      icon: 'error',
      title: message,
      showConfirmButton: false,
      timer: 1500
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPermissions.length / this.rowsPerPage);
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const pages: number[] = [];
    
    // Show 5 pages at a time
    let start: number;
    let end: number;
    
    // If total pages is less than 5, show all pages
    if (totalPages <= 5) {
      start = 1;
      end = totalPages;
    }
    // For first 3 pages
    else if (current <= 3) {
      start = 1;
      end = 5;
    }
    // For last 3 pages
    else if (current >= totalPages - 2) {
      start = totalPages - 4;
      end = totalPages;
    }
    // For all other pages
    else {
      start = current - 2;
      end = current + 2;
    }
    
    // Generate array of page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}