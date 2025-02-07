import { Component, OnInit } from '@angular/core';
import { CategoryModel } from '../../shared/models/category-model';
import { CategoryService } from '../../shared/services/category.service';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';

import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { HighlightPipe } from '../../shared/pipe/highlight.pipe';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-category',
  imports: [NgFor, NgIf, FormsModule, ReactiveFormsModule,HighlightPipe],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
})
export default class CategoryComponent implements OnInit {
  listCategories: CategoryModel[] = [];
  filteredCategories: CategoryModel[] = [];
  paginatedCategories: CategoryModel[] = [];
  formCategory: FormGroup = new FormGroup({});
  isUpdate: boolean = false;
  formVisible = false;
  selectedCategory: CategoryModel | null = null;
  searchTerm: string = '';
  Math = Math;
  currentPage: number = 1;
  rowsPerPage: number = 5;

  access = {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canReadOne: false,
    canExport:false
  };

  constructor(private categoryService: CategoryService, private location: Location, private menuService:MenuService) { }

  ngOnInit(): void {
    this.list();  // Cargar categorías al iniciar
    this.initForm();  // Inicializar el formulario
    this.initializeAccess();
  }

  private initializeAccess(): void {
    this.access = {
      canCreate: this.menuService.hasPermission('POST /categories'),
      canRead: this.menuService.hasPermission('GET /categories'),
      canUpdate: this.menuService.hasPermission('PUT /categories/{id}'),
      canDelete: this.menuService.hasPermission('DELETE /categories/{id}'),
      canReadOne: this.menuService.hasPermission('GET /categories/{id}'),
      canExport: this.menuService.hasPermission('GET /categories/export')
    };
  }

  initForm() {
    this.formCategory = new FormGroup({
      id: new FormControl(''),
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ])
    });
  }

  toggleFormVisibility(): void {
    this.formVisible = !this.formVisible;
    if (!this.formVisible) {
      this.resetForm();  // Resetea el formulario si se oculta
    }
  }

  goBack(): void {
    this.location.back();  // Regresa a la vista anterior
  }

  list() {
    this.categoryService.getCategories().subscribe(resp => {
      if (resp) {
        this.listCategories = resp;
        this.filteredCategories = this.getFilteredCategories();
        this.updatePagination();
      }
    });
  }

  save() {
    if (this.formCategory.invalid) {
      return;  // Si el formulario no es válido, no hacer nada
    }
    this.categoryService.saveCategory(this.formCategory.value).subscribe({
      next: (resp) => {
        this.list();  // Recargar la lista de categorías
        this.formCategory.reset();  // Limpiar el formulario
        this.toggleFormVisibility();  // Ocultar el formulario
        Swal.fire({
          icon: "success",
          title: "Categoria <b>creada</b> con exito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo crear la categoria",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
        this.toggleFormVisibility();  // Ocultar el formulario en caso de error
      }
    });
  }

  update() {
    if (this.formCategory.invalid) {
      return;  // Si el formulario no es válido, no hacer nada
    }
    this.categoryService.updateCategory(this.formCategory.value.id, this.formCategory.value).subscribe({
      next: (resp) => {
        this.list();  // Recargar la lista de categorías
        this.formCategory.reset();  // Limpiar el formulario
        this.toggleFormVisibility();  // Ocultar el formulario
        Swal.fire({
          icon: "success",
          title: "Categoria <b>actualizada</b> con exito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo actualizar la categoria",
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
          Estas seguro de <b>eliminar</b>,
          esta <b>Categoria</b>?
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
      buttonsStyling: false // Desactiva el estilo predeterminado de SweetAlert2
    }).then((result) => {
      if (result.isConfirmed) {
        this.categoryService.deleteCategory(id).subscribe({
          next: (resp) => {
            // Eliminar la categoría localmente si la respuesta indica éxito
            this.listCategories = this.listCategories.filter(category => category.id !== id);
            this.updatePagination();
            Swal.fire({
              icon: "success",
              title: "Categoria <b>eliminada</b> con exito!",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          },
          error: (err) => {
            Swal.fire({
              icon: "error",
              title: "No se pudo eliminar la categoria",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          }
        });
      }
    }
    )


  }

  getFilteredCategories(): CategoryModel[] {
    if (!this.searchTerm?.trim()) {
      return [...this.listCategories];
    }
    return this.listCategories.filter(category =>
      category.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.updatePagination();
  }

  newCategory() {
    this.resetForm();
    this.isUpdate = false;
    this.toggleFormVisibility();
  }

  selectItem(item: CategoryModel) {
    this.isUpdate = true;
    this.selectedCategory = item;
    this.formCategory.patchValue({
      id: item.id,
      name: item.name
    });
    this.toggleFormVisibility();
  }

  resetForm() {
    this.formCategory.reset();
    this.isUpdate = false;
    this.selectedCategory = null;
  }

  updatePagination() {
    // Asegurarse de que filteredCategories esté actualizado
    this.filteredCategories = this.getFilteredCategories();

    const totalItems = this.filteredCategories.length;
    const totalPages = Math.ceil(totalItems / this.rowsPerPage);

    // Ajustar la página actual si es necesario
    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    // Calcular índices de inicio y fin
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = Math.min(startIndex + this.rowsPerPage, totalItems);

    // Actualizar categorías paginadas
    this.paginatedCategories = this.filteredCategories.slice(startIndex, endIndex);
  }

  changeRowsPerPage(rows: number) {
    this.rowsPerPage = Number(rows); // Asegurarse de que sea un número
    this.currentPage = 1; // Reiniciar a la primera página
    this.updatePagination();
  }

  changePage(page: number) {
    const totalPages = Math.ceil(this.filteredCategories.length / this.rowsPerPage);

    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  onSearchChange() {
    this.currentPage = 1; // Reiniciar a la primera página
    this.filteredCategories = this.getFilteredCategories();
    this.updatePagination();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredCategories.length / this.rowsPerPage);
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
