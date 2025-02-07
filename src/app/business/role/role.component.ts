import { Component, OnInit } from '@angular/core';
import { RoleModel } from '../../shared/models/role-model';
import { RoleService } from '../../shared/services/role.service';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';

import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { RoleFormatPipe } from '../../shared/pipe/roleformat.pipe';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-role',
  imports: [NgFor, NgIf, FormsModule, ReactiveFormsModule,RoleFormatPipe],
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export default class RoleComponent implements OnInit {
  listRoles: RoleModel[] = [];
  formRole: FormGroup = new FormGroup({});
  isUpdate: boolean = false;
  formVisible = false;
  selectedRole: RoleModel | null = null;
  searchTerm: string = '';

  Math = Math;

  currentPage: number = 1;
  rowsPerPage: number = 5;
  filteredRoles: RoleModel[] = [];
  paginatedRoles: RoleModel[] = [];

  access = {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canExport:false,
  };

  constructor(
    private roleService: RoleService,
    private location: Location,
    private menuService:MenuService,
  ) { }

  ngOnInit(): void {
    this.list();
    this.initForm();
    this.initializeAccess();
  }
  

  initForm() {
    this.formRole = new FormGroup({
      id: new FormControl(''),
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]),
      description: new FormControl('', [
        Validators.required
      ])
    });
  }

  private initializeAccess(): void {
    this.access = {
      canCreate: this.menuService.hasPermission('POST /roles'),
      canRead: this.menuService.hasPermission('GET /roles'),
      canUpdate: this.menuService.hasPermission('PUT /roles/{id}'),
      canDelete: this.menuService.hasPermission('DELETE /roles/{id}'),
      canExport: this.menuService.hasPermission('GET /permissions/export')
    };
  }

  toggleFormVisibility(): void {
    this.formVisible = !this.formVisible;
    if (!this.formVisible) {
      this.resetForm();
    }
  }

  save() {
    if (this.formRole.invalid) {
      return;
    }

    this.roleService.createRole(this.formRole.value).subscribe({
      next: () => {
        this.list();
        this.formRole.reset();
        this.toggleFormVisibility();
        Swal.fire({
          icon: "success",
          title: "Rol <b>creado</b> con éxito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo crear el rol",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
        this.toggleFormVisibility();
      }
    });
  }

  update() {
    if (this.formRole.invalid) {
      Swal.fire({
        icon: "error",
        title: "Formulario inválido",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }

    const roleId = this.formRole.value.id;
    
    this.roleService.updateRole(roleId, this.formRole.value).subscribe({
      next: () => {
        this.list();
        this.formRole.reset();
        this.toggleFormVisibility();
        Swal.fire({
          icon: "success",
          title: "Rol <b>actualizado</b> con éxito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo actualizar el rol",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      }
    });
  }

  delete(id: number): void {
    Swal.fire({
      title: "<strong>Eliminar</strong>",
      icon: "warning",
      html: `
          ¿Estás seguro de <b>eliminar</b>
          este <b>Rol</b>?
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
        this.roleService.deleteRole(id).subscribe({
          next: () => {
            this.listRoles = this.listRoles.filter(role => role.id !== id);
            this.updatePagination();
            Swal.fire({
              icon: "success",
              title: "Rol <b>eliminado</b> con éxito!",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          },
          error: (err) => {
            Swal.fire({
              icon: "error",
              title: "No se pudo eliminar el rol",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          }
        });
      }
    });
  }

  newRole() {
    this.resetForm();
    this.isUpdate = false;
    this.toggleFormVisibility();
  }

  selectItem(item: RoleModel) {
    this.isUpdate = true;
    this.selectedRole = item;
    this.formRole.patchValue({
      id: item.id,
      name: item.name,
      description: item.description
    });
    this.toggleFormVisibility();
  }

  resetForm() {
    this.formRole.reset();
    this.isUpdate = false;
    this.selectedRole = null;
  }

  goBack(): void {
    this.location.back();
  }

  getFilteredRoles(): RoleModel[] {
    if (!this.searchTerm?.trim()) {
      return [...this.listRoles];
    }
    return this.listRoles.filter(rol =>
      rol.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  updatePagination() {
    // Actualizar la lista filtrada
    this.filteredRoles = this.getFilteredRoles();
    
    const totalItems = this.filteredRoles.length;
    const totalPages = Math.ceil(totalItems / this.rowsPerPage);
    
    // Ajustar la página actual si es necesario
    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    // Calcular índices de inicio y fin
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = Math.min(startIndex + this.rowsPerPage, totalItems);
    
    // Actualizar elementos paginados
    this.paginatedRoles = this.filteredRoles.slice(startIndex, endIndex);
  }

  changeRowsPerPage(rows: number) {
    this.rowsPerPage = Number(rows); // Asegurar que sea un número
    this.currentPage = 1; // Reiniciar a la primera página
    this.updatePagination();
  }

  changePage(page: number) {
    const totalPages = Math.ceil(this.filteredRoles.length / this.rowsPerPage);
    
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
    this.roleService.getRoles().subscribe(resp => {
      if (resp) {
        this.listRoles = resp;
        this.updatePagination();
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRoles.length / this.rowsPerPage);
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