// user.component.ts
import { Component, OnInit } from '@angular/core';
import { UserModel } from '../../shared/models/user-model';
import { RoleModel } from '../../shared/models/role-model';
import { UserService } from '../../shared/services/user.service';
import { RoleService } from '../../shared/services/role.service';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';

import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { HighlightPipe } from '../../shared/pipe/highlight.pipe';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-user',
  imports: [NgFor, NgIf, FormsModule, ReactiveFormsModule,HighlightPipe],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export default class UserComponent implements OnInit {
  listUsers: UserModel[] = [];
  availableRoles: RoleModel[] = [];
  formUser: FormGroup = new FormGroup({});
  isUpdate: boolean = false;
  formVisible = false;
  selectedUser: UserModel | null = null;
  searchTerm: string = '';

  Math = Math;

  currentPage: number = 1;
  rowsPerPage: number = 5;
  filteredUsers: UserModel[] = [];
  paginatedUsers: UserModel[] = [];

  access = {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canReadOne: false,
    canExport:false,
    canAssignRole: false,
    canRemoveRole: false,
  };

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private location: Location,
    private menuService:MenuService
  ) { }

  ngOnInit(): void {
    this.list();
    this.loadRoles();
    this.initForm();
    this.initializeAccess();
  }

  private initializeAccess(): void {
    this.access = {
      canCreate: this.menuService.hasPermission('POST /users'),
      canRead: this.menuService.hasPermission('GET /users'),
      canUpdate: this.menuService.hasPermission('PUT /users/{id}'),
      canDelete: this.menuService.hasPermission('DELETE /users/{id}'),
      canReadOne: this.menuService.hasPermission('GET /users/{id}'),
      canExport: this.menuService.hasPermission('GET /users/export'),
      canAssignRole: this.menuService.hasPermission('POST /users/{userId}/roles/{roleId}'),
      canRemoveRole: this.menuService.hasPermission('DELETE /users/{userId}/roles/{roleId}'),
    };
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles.map(role => ({
          ...role,
          name: role.name.replace('ROLE_', '')
        }));
      },
      error: (error) => {
        console.error('Error cargando roles:', error);
        Swal.fire({
          icon: "error",
          title: "Error al cargar roles",
          text: "No se pudieron cargar los roles disponibles",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      }
    });
  }

  initForm() {
    this.formUser = new FormGroup({
      id: new FormControl(''),
      username: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]),
      name: new FormControl('', [
        Validators.required
      ]),
      lastName: new FormControl('', [
        Validators.required
      ]),
      phoneNumber: new FormControl('', [
        Validators.required
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.email
      ]),
      password: new FormControl('', [
        Validators.minLength(6)
      ]),
      roles: new FormControl([], [
        Validators.required
      ])
    });
  }

  toggleFormVisibility(): void {
    this.formVisible = !this.formVisible;
    if (!this.formVisible) {
      this.resetForm();
    }
  }

  async save() {
    if (this.formUser.invalid) {
      Swal.fire({
        icon: "error",
        title: "Formulario inválido",
        text: "Por favor, complete todos los campos requeridos",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }

    try {
      // 1. Extraer los roles seleccionados
      const selectedRoles = Array.isArray(this.formUser.value.roles) 
        ? this.formUser.value.roles 
        : [this.formUser.value.roles];
      
      // 2. Crear una copia del formulario sin roles para crear el usuario
      const userData = { ...this.formUser.value };
      delete userData.roles;

      // 3. Crear el usuario
      const createdUser = await firstValueFrom(this.userService.createUser(userData));

      // 4. Asignar roles uno por uno
      for (const roleId of selectedRoles) {
        await firstValueFrom(this.userService.addRoleToUser(createdUser.id, roleId));
      }

      // 5. Actualizar la lista y mostrar mensaje de éxito
      this.list();
      this.formUser.reset();
      this.toggleFormVisibility();
      
      Swal.fire({
        icon: "success",
        title: "Usuario creado con éxito!",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
    } catch (error) {
      console.error('Error en el proceso de crear usuario:', error);
      Swal.fire({
        icon: "error",
        title: "Error al crear usuario",
        text: "Hubo un problema al crear el usuario o asignar sus roles",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
    }
  }

  async update() {
    if (this.formUser.invalid) {
      Swal.fire({
        icon: "error",
        title: "Formulario inválido",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }

    try {
      const userId = this.formUser.value.id;
      const newRoleIds = Array.isArray(this.formUser.value.roles) 
        ? this.formUser.value.roles 
        : [this.formUser.value.roles];
      const currentRoleIds = this.selectedUser?.roles.map(r => r.id) || [];

      // 1. Actualizar información básica del usuario
      const userData = { ...this.formUser.value };
      delete userData.roles;
      await firstValueFrom(this.userService.updateUser(userId, userData));

      // 2. Eliminar roles que ya no están seleccionados
      for (const roleId of currentRoleIds) {
        if (!newRoleIds.includes(roleId)) {
          await firstValueFrom(this.userService.removeRoleFromUser(userId, roleId));
        }
      }

      // 3. Agregar nuevos roles seleccionados
      for (const roleId of newRoleIds) {
        if (!currentRoleIds.includes(roleId)) {
          await firstValueFrom(this.userService.addRoleToUser(userId, roleId));
        }
      }

      // 4. Actualizar lista y mostrar mensaje de éxito
      this.list();
      this.formUser.reset();
      this.toggleFormVisibility();
      
      Swal.fire({
        icon: "success",
        title: "Usuario actualizado con éxito!",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
    } catch (error) {
      console.error('Error en el proceso de actualizar usuario:', error);
      Swal.fire({
        icon: "error",
        title: "Error al actualizar usuario",
        text: "Hubo un problema al actualizar el usuario o sus roles",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
    }
  }

  delete(id: number): void {
    Swal.fire({
      title: "<strong>Eliminar</strong>",
      icon: "warning",
      html: `
          ¿Estás seguro de <b>eliminar</b>
          este <b>Usuario</b>?
        `,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: `
          <i class="fa fa-thumbs-up"></i> Eliminar
        `,
      cancelButtonText: `
          <i class="fa fa-thumbs-down"></i> Cancelar
        `,
      customClass: {
        confirmButton: 'mr-2 mb-2 md:mb-0 bg-red-500 border border-red-500 px-5 py-2 text-sm shadow-sm font-medium tracking-wider text-white rounded-full hover:shadow-lg hover:bg-red-600',
        cancelButton: 'ml-2 mb-2 md:mb-0 bg-gray-500 border border-gray-500 px-5 py-2 text-sm shadow-sm font-medium tracking-wider text-white rounded-full hover:shadow-lg hover:bg-gray-600'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.userService.deleteUser(id).subscribe({
          next: (resp) => {
            this.listUsers = this.listUsers.filter(user => user.id !== id);
            this.updatePagination();
            Swal.fire({
              icon: "success",
              title: "Usuario <b>eliminado</b> con éxito!",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          },
          error: (err) => {
            Swal.fire({
              icon: "error",
              title: "No se pudo eliminar el usuario",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          }
        });
      }
    });
  }

  getRoleNames(roles: RoleModel[]): string {
    return roles.map(role => role.name.replace('ROLE_', '')).join(', ');
  }

  newUser() {
    this.resetForm();
    this.isUpdate = false;
    this.toggleFormVisibility();
  }

  selectItem(item: UserModel) {
    this.isUpdate = true;
    this.selectedUser = item;
    this.formUser.patchValue({
      id: item.id,
      username: item.username,
      email: item.email,
      name: item.name,
      lastName: item.lastName,
      phoneNumber: item.phoneNumber,
      roles: item.roles.map(role => role.id)
    });
    this.toggleFormVisibility();
  }

  resetForm() {
    this.formUser.reset();
    this.isUpdate = false;
    this.selectedUser = null;
  }

  goBack(): void {
    this.location.back();
  }

  getFilteredUsers(): UserModel[] {
    if (!this.searchTerm?.trim()) {
      return [...this.listUsers];
    }
    const searchTermLower = this.searchTerm.toLowerCase().trim();
    
    return this.listUsers.filter(user =>
      user.name.toLowerCase().includes(searchTermLower) ||
      user.username.toLowerCase().includes(searchTermLower) ||
      user.lastName.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower) ||
      user.phoneNumber.toLowerCase().includes(searchTermLower)
    );
  }

  updatePagination() {
    // Actualizar la lista filtrada
    this.filteredUsers = this.getFilteredUsers();
    
    const totalItems = this.filteredUsers.length;
    const totalPages = Math.ceil(totalItems / this.rowsPerPage);
    
    // Ajustar la página actual si es necesario
    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    // Calcular índices de inicio y fin
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = Math.min(startIndex + this.rowsPerPage, totalItems);
    
    // Actualizar elementos paginados
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  changeRowsPerPage(rows: number) {
    this.rowsPerPage = Number(rows); // Asegurar que sea un número
    this.currentPage = 1; // Reiniciar a la primera página
    this.updatePagination();
  }

  changePage(page: number) {
    const totalPages = Math.ceil(this.filteredUsers.length / this.rowsPerPage);
    
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onSearchChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.updatePagination();
  }

  list() {
    this.userService.getUsers().subscribe(resp => {
      if (resp) {
        this.listUsers = resp;
        this.updatePagination();
      }
    });
  }
  
  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.rowsPerPage);
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