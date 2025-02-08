import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SaleModel } from '../../shared/models/sale-model';
import { SaleService } from '../../shared/services/sale.service';
import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-sale-return',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sale-return.component.html',
  styleUrl: './sale-return.component.css'
})
export default class SaleReturnComponent implements OnInit {
  dateRangeForm: FormGroup;
  sales: SaleModel[] = [];
  selectedSale: SaleModel | null = null;
  isModalOpen = false;
  loading = false;

  access = {
    canSearch: false,
    canReturnEntire: false,
    canExportEntire: false,
    canReturnPartial: false
  };

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private menuService:MenuService
  ) {
    const today = new Date();
    const startDate = new Date(today.setHours(0, 0, 0, 0));
    const endDate = new Date(today.setHours(23, 59, 59, 999));
  
    this.dateRangeForm = this.fb.group({
      startDate: [this.formatDateForInput(startDate)],
      endDate: [this.formatDateForInput(endDate)]
    });
  }

  private formatDateForInput(date: Date): string {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  ngOnInit(): void {
    this.searchSales(); // Llamamos al método existente que ya tiene la lógica
    this.initializeAccess();
  }

  private initializeAccess(): void {
    this.access = {
      canSearch: this.menuService.hasPermission('GET /sales/search'),
      canReturnEntire: this.menuService.hasPermission('POST /sales/{saleId}/return-entire'),
      canExportEntire: this.menuService.hasPermission('GET /sales/{saleId}/receipt'),
      canReturnPartial: this.menuService.hasPermission('POST /sales/{saleId}/return'),
    };
  }

  searchSales() {
    const startDate = new Date(this.dateRangeForm.get('startDate')?.value);
    const endDate = new Date(this.dateRangeForm.get('endDate')?.value);
  
    // Asegurarnos de que startDate tenga la hora en 00:00:00
    startDate.setHours(0, 0, 0, 0);
    // Asegurarnos de que endDate tenga la hora en 23:59:59
    endDate.setHours(23, 59, 59, 999);
  
    this.loading = true;
  
    // Convertir a ISO string para el backend
    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();
  
    this.saleService.searchSalesByDateRange(startDateTime, endDateTime)
      .subscribe({
        next: (sales) => {
          this.sales = sales;
          this.loading = false;
          if (sales.length === 0) {
            Swal.fire({
              icon: "info",
              title: "No hay ventas en el rango de fechas seleccionado",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          }
        },
        error: (err) => {
          Swal.fire({
            icon: "error",
            title: "Error al cargar las ventas",
            text: "Por favor, intente nuevamente",
            showConfirmButton: false,
            timerProgressBar: true,
            timer: 1500
          });
          this.loading = false;
        }
      });
  }

  openSaleDetails(sale: SaleModel) {
    this.selectedSale = sale;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedSale = null;
  }

  returnEntireSale() {
    // Verifica si selectedSale está definido antes de proceder
    if (!this.selectedSale) return; // O si tienes algún valor predeterminado o lógica adicional

    Swal.fire({
      title: "<strong>Devolver</strong>",
      icon: "question",
      html: `
        ¿Estás seguro de <b>devolver</b>,
        toda la <b>Venta</b>?
      `,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: `
        <i class="fa fa-thumbs-up"></i> Devolver
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
      if (result.isConfirmed) { // Asegúrate de confirmar antes de proceder
        // Verifica si selectedSale no es null o undefined
        if (this.selectedSale?.id) {
          this.saleService.returnEntireSale(this.selectedSale.id)
            .subscribe({
              next: () => {
                Swal.fire({
                  icon: "success",
                  title: "Devolución <b>procesada</b> exitosamente!",
                  showConfirmButton: false,
                  timerProgressBar: true,
                  timer: 1500
                });
                // Remove the sale from the list
                this.sales = this.sales.filter(sale => sale.id !== this.selectedSale!.id);
                this.closeModal();
              },
              error: (err) => {
                Swal.fire({
                  icon: "error",
                  title: "Devolución fallida",
                  showConfirmButton: false,
                  timerProgressBar: true,
                  timer: 1500
                });
              }
            });
        }
      } else {
        console.log('Devolución cancelada');
      }
    });
  }

  returnProduct(productId: number, quantity: number) {
    if (!this.selectedSale) return;

    Swal.fire({
      title: "<strong>Devolver</strong>",
      icon: "question",
      html: `
        ¿Estás seguro de <b>devolver</b>,
        este el <b>Producto</b>?
      `,
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: `
        <i class="fa fa-thumbs-up"></i> Devolver
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
        if (this.selectedSale?.id) {
          this.saleService.processReturn(this.selectedSale.id, productId, quantity)
            .subscribe({
              next: (saleDeleted) => {
                Swal.fire({
                  icon: "success",
                  title: "Producto <b>devuelto</b> exitosamente!",
                  showConfirmButton: false,
                  timerProgressBar: true,
                  timer: 1500
                });

                if (saleDeleted) {
                  // Sale was deleted, remove from list
                  this.sales = this.sales.filter(sale => sale.id !== this.selectedSale!.id);
                  this.closeModal();
                } else {
                  // Refresh the sale details
                  this.searchSales();
                }
              },
              error: (err) => {
                Swal.fire({
                  icon: "error",
                  title: "Devolucion fallida",
                  showConfirmButton: false,
                  timerProgressBar: true,
                  timer: 1500
                });
              }
            });
        }
      } else {
        console.log('Devolución cancelada');
      }
    });
  }

  downloadSaleReceipt(saleId: number) {
    if (!saleId) return;
  
    // Mostrar indicador de carga
    Swal.fire({
      title: 'Generando PDF...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    this.saleService.generateReceipt(saleId).subscribe({
      next: (blob: Blob) => {
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `venta_${saleId}.pdf`;
        
        // Trigger la descarga
        document.body.appendChild(link);
        link.click();
        
        // Limpieza
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
  
        // Cerrar el indicador de carga y mostrar éxito
        Swal.fire({
          icon: 'success',
          title: 'PDF generado exitosamente',
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (error) => {
        console.error('Error downloading receipt:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al generar el PDF',
          text: 'Por favor, intente nuevamente',
          showConfirmButton: true
        });
      }
    });
  }

}