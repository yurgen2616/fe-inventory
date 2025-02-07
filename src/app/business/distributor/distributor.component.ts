import { Component, OnInit } from '@angular/core';
import { DistributorModel } from '../../shared/models/distributor-models';
import { DistributorService } from '../../shared/services/distributor.service';
import { NgFor, NgIf } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { HighlightPipe } from '../../shared/pipe/highlight.pipe';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-distributor',
  imports: [NgFor, NgIf, FormsModule, ReactiveFormsModule,HighlightPipe],
  templateUrl: './distributor.component.html',
  styleUrls: ['./distributor.component.css'] 
})
export default class DistributorComponent implements OnInit {
  listDistributors: DistributorModel[] = [];
  filteredDistributors: DistributorModel[] = [];
  paginatedTables: DistributorModel[] = [];
  formDistributor: FormGroup = new FormGroup({});
  isUpdate: boolean = false;
  formVisible = false;
  selectedDistributor: DistributorModel | null = null;
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

  constructor(private distributorService: DistributorService, private location: Location,private menuService:MenuService) { }

  ngOnInit(): void {
    this.list();  // Cargar distribuidores al iniciar
    this.initForm();  // Inicializar el formulario
    this.initializeAccess();
  }

  private initializeAccess(): void {
    this.access = {
      canCreate: this.menuService.hasPermission('POST /distributors'),
      canRead: this.menuService.hasPermission('GET /distributors'),
      canUpdate: this.menuService.hasPermission('PUT /distributors/{id}'),
      canDelete: this.menuService.hasPermission('DELETE /distributors/{id}'),
      canReadOne: this.menuService.hasPermission('GET /distributors/{id}'),
      canExport: this.menuService.hasPermission('GET /distributors/export')
    };
  }

  initForm() {
    this.formDistributor = new FormGroup({
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

  save() {
    if (this.formDistributor.invalid) {
      return;  // Si el formulario no es válido, no hacer nada
    }
    this.distributorService.saveDistributor(this.formDistributor.value).subscribe({
      next: (resp) => {
        this.list();  // Recargar la lista de distribuidores
        this.formDistributor.reset();  // Limpiar el formulario
        this.toggleFormVisibility();  // Ocultar el formulario
        Swal.fire({
          icon: "success",
          title: "Distribuidor <b>creado</b> con exito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo crear el distribuidor",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      }
    });
  }

  update() {
    if (this.formDistributor.invalid) {
      return;  // Si el formulario no es válido, no hacer nada
    }
    this.distributorService.updateDistributor(this.formDistributor.value.id, this.formDistributor.value).subscribe({
      next: (resp) => {
        this.list();  // Recargar la lista de categorías
        this.formDistributor.reset();  // Limpiar el formulario
        this.toggleFormVisibility();  // Ocultar el formulario
        Swal.fire({
          icon: "success",
          title: "Distribuidor <b>actualizado</b> con exito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo actualizar el distribuidor",
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
            este <b>Distribuidor</b>?
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
        this.distributorService.deleteDistributor(id).subscribe({
          next: (resp) => {
            // Eliminar el distribuidor localmente si la respuesta indica éxito
            this.listDistributors = this.listDistributors.filter(distributor => distributor.id !== id);
            this.updatePagination();
            Swal.fire({
              icon: "success",
              title: "Distribuidor <b>eliminado</b> con exito!",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          },
          error: (err) => {
            Swal.fire({
              icon: "error",
              title: "No se pudo eliminar el distribuidor",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          }
        });
      }
    })
  }

  newDistributor() {
    this.resetForm();
    this.isUpdate = false;
    this.toggleFormVisibility();
  }

  selectItem(item: DistributorModel) {
    this.isUpdate = true;
    this.selectedDistributor = item;
    this.formDistributor.patchValue({
      id: item.id,
      name: item.name
    });
    this.toggleFormVisibility();
  }

  resetForm() {
    this.formDistributor.reset();
    this.isUpdate = false;
    this.selectedDistributor = null;
  }

  goBack(): void {
    this.location.back();  // Regresa a la vista anterior
  }

  getFilteredDistributors(): DistributorModel[] {
    if (!this.searchTerm?.trim()) {
      return [...this.listDistributors];
    }
    return this.listDistributors.filter(distributor =>
      distributor.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  updatePagination() {
    // Actualizar la lista filtrada
    this.filteredDistributors = this.getFilteredDistributors();
    
    const totalItems = this.filteredDistributors.length;
    const totalPages = Math.ceil(totalItems / this.rowsPerPage);
    
    // Ajustar la página actual si es necesario
    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    // Calcular índices de inicio y fin
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = Math.min(startIndex + this.rowsPerPage, totalItems);
    
    // Actualizar elementos paginados
    this.paginatedTables = this.filteredDistributors.slice(startIndex, endIndex);
  }

  changeRowsPerPage(rows: number) {
    this.rowsPerPage = Number(rows); // Asegurar que sea un número
    this.currentPage = 1; // Reiniciar a la primera página
    this.updatePagination();
  }

  changePage(page: number) {
    const totalPages = Math.ceil(this.filteredDistributors.length / this.rowsPerPage);
    
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
    this.distributorService.getDistributors().subscribe(resp => {
      if (resp) {
        this.listDistributors = resp;
        this.updatePagination();
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredDistributors.length / this.rowsPerPage);
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
