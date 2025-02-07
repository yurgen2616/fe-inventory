import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SalesFormModel } from '../../shared/models/salesForm-model';
import { Location } from '@angular/common';
import { SalesFormService } from '../../shared/services/salesForm.service';

import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { HighlightPipe } from '../../shared/pipe/highlight.pipe';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-sales-form',
  imports: [NgFor, NgIf, FormsModule, ReactiveFormsModule,HighlightPipe],
  templateUrl: './sales-form.component.html',
  styleUrls: ['./sales-form.component.css']
})
export default class SalesFormComponent implements OnInit {
  listSalesForms: SalesFormModel[] = [];
  formSalesForm: FormGroup;
  isUpdate = false;
  formVisible = false;
  selectedSalesForm: SalesFormModel | null = null;
  searchTerm = '';

  Math = Math;

  currentPage: number = 1;
  rowsPerPage: number = 5;
  paginatedTables: SalesFormModel[] = [];
  filteredSalesForm: SalesFormModel[] = [];

  access = {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canReadOne: false,
    canExport:false
  };


  constructor(private salesFormService: SalesFormService, private location: Location,  private menuService:MenuService) {
    this.formSalesForm = this.initForm();
  }

  ngOnInit(): void {
    this.list();
    this.initForm();
    this.initializeAccess();
  }

  private initializeAccess(): void {
    this.access = {
      canCreate: this.menuService.hasPermission('POST /sales-forms'),
      canRead: this.menuService.hasPermission('GET /sales-forms'),
      canUpdate: this.menuService.hasPermission('PUT /sales-forms/{id}'),
      canDelete: this.menuService.hasPermission('DELETE /sales-forms/{id}'),
      canReadOne: this.menuService.hasPermission('GET /sales-forms/{id}'),
      canExport: this.menuService.hasPermission('GET /sales-forms/export')
    };
  }

  private initForm(): FormGroup {
    return new FormGroup({
      id: new FormControl(''),
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ])
    });
  }

  goBack(): void {
    this.location.back();
  }

  toggleFormVisibility(): void {
    this.formVisible = !this.formVisible;
    if (!this.formVisible) {
      this.resetForm();
    }
  }

  async save(): Promise<void> {
    if (this.formSalesForm.invalid) {
      return;
    }
    try {
      const resp = await this.salesFormService.saveSalesForm(this.formSalesForm.value).toPromise();
      if (resp) {
        this.list();
        this.resetForm();
        this.toggleFormVisibility();
        Swal.fire({
          icon: "success",
          title: "Forma de venta <b>creada</b> con exito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "No se pudo crear la forma de venta",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
    }
  }

  update() {
    if (this.formSalesForm.invalid) {
      return;  // Si el formulario no es válido, no hacer nada
    }
    this.salesFormService.updateSalesForm(this.formSalesForm.value.id, this.formSalesForm.value).subscribe({
      next: (resp) => {
        this.list();  // Recargar la lista de categorías
        this.formSalesForm.reset();  // Limpiar el formulario
        this.toggleFormVisibility();
        Swal.fire({
          icon: "success",
          title: "Forma de venta <b>actualizada</b> con exito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo actualizar la forma de venta",
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
        esta <b>Forma de venta</b>?
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
        this.salesFormService.deleteSalesForm(id).subscribe({
          next: (resp) => {
            // Eliminar el distribuidor localmente si la respuesta indica éxito
            this.listSalesForms = this.listSalesForms.filter(saleForms => saleForms.id !== id);
            this.updatePagination();
            Swal.fire({
              icon: "success",
              title: "Forma de venta <b>eliminada</b> con exito!",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          },
          error: (err) => {
            Swal.fire({
              icon: "error",
              title: "No se pudo eliminar la forma de venta",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          }
        });
      }
    })
  }

  newSalesForm(): void {
    this.resetForm();
    this.isUpdate = false;
    this.toggleFormVisibility();
  }

  selectItem(item: SalesFormModel): void {
    this.isUpdate = true;
    this.selectedSalesForm = item;
    this.formSalesForm.patchValue({
      id: item.id,
      name: item.name
    });
    this.toggleFormVisibility();
  }

  private resetForm(): void {
    this.formSalesForm.reset();
    this.isUpdate = false;
    this.selectedSalesForm = null;
  }

  getFilteredSalesForm(): SalesFormModel[] {
    if (!this.searchTerm?.trim()) {
      return [...this.listSalesForms];
    }
    return this.listSalesForms.filter(salesForm =>
      salesForm.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  updatePagination() {
    // Actualizar la lista filtrada
    this.filteredSalesForm = this.getFilteredSalesForm();
    
    const totalItems = this.filteredSalesForm.length;
    const totalPages = Math.ceil(totalItems / this.rowsPerPage);
    
    // Ajustar la página actual si es necesario
    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    // Calcular índices de inicio y fin
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = Math.min(startIndex + this.rowsPerPage, totalItems);
    
    // Actualizar elementos paginados
    this.paginatedTables = this.filteredSalesForm.slice(startIndex, endIndex);
  }

  changeRowsPerPage(rows: number) {
    this.rowsPerPage = Number(rows); // Asegurar que sea un número
    this.currentPage = 1; // Reiniciar a la primera página
    this.updatePagination();
  }

  changePage(page: number) {
    const totalPages = Math.ceil(this.filteredSalesForm.length / this.rowsPerPage);
    
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
    this.salesFormService.getSalesForms().subscribe(resp => {
      if (resp) {
        this.listSalesForms = resp;
        this.updatePagination();
      }
    });
  }
  get totalPages(): number {
    return Math.ceil(this.filteredSalesForm.length / this.rowsPerPage);
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
