import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { format } from 'date-fns';
import { SaleModel } from '../../shared/models/sale-model';
import { SaleService } from '../../shared/services/sale.service';
import { SaleDetailModel } from '../../shared/models/saleDetail-model';

import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { HighlightPipe } from "../../shared/pipe/highlight.pipe";
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-sale-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgFor, NgIf, FormsModule,
    HighlightPipe
],
  templateUrl: './sale-report.component.html',
  styleUrl: './sale-report.component.css'
})
export default class SaleReportComponent implements OnInit {
  reportForm: FormGroup;
  sales: SaleModel[] = [];
  loading = false;
  error: string | null = null;

  // Pagination and search properties
  Math = Math;
  currentPage: number = 1;
  rowsPerPage: number = 5;
  paginatedSales: SaleModel[] = [];
  filteredSales: SaleModel[] = [];
  searchTerm: string = '';
  reportGenerated = false;

  access = {
    canGenerateReport: false,
  };

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private menuService:MenuService
  ) {
    this.reportForm = this.fb.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    });
  }

  ngOnInit(): void { this.initializeAccess(); }

  private initializeAccess(): void {
    this.access = {
      canGenerateReport: this.menuService.hasPermission('GET /sales/report'),
    };
  }

  generateReport() {
    if (this.reportForm.invalid) {
      Swal.fire({
        icon: "error",
        title: "Por favor seleccione un rango de fechas",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }
  
    this.loading = true;
    this.error = null;
  
    const { startDate, endDate } = this.reportForm.value;
  
    const formattedStart = format(new Date(startDate), "yyyy-MM-dd'T'HH:mm:ss");
    const formattedEnd = format(new Date(endDate), "yyyy-MM-dd'T'HH:mm:ss");
  
    this.saleService.searchSalesByDateRange(formattedStart, formattedEnd)
    .subscribe({
      next: (sales) => {
        if (sales.length === 0) {
          Swal.fire({
            icon: "info",
            title: "Sin resultados",
            text: "No se encontraron ventas en el rango de fechas seleccionado",
            showConfirmButton: false,
            timerProgressBar: true,
            timer: 1500
          });
          
          this.resetData();
        } else {
          this.sales = sales.map(sale => ({
            ...sale,
            details: sale.details.map(detail => ({
              ...detail,
              purchasePriceAtSale: detail.purchasePriceAtSale || 0,
              product: {
                id: detail.product?.id || 0,
                name: detail.product?.name || 'Unknown Product',
                purchasePrice: detail.purchasePriceAtSale || 0
              }
            }))
          }));
          this.resetPagination();
          this.reportGenerated = true;
          this.updatePagination();
        }
        
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: 'Error al obtener ventas ',
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
        
        this.resetData();
        this.loading = false;
      }
    });
  }

  private resetData() {
    this.sales = [];
    this.filteredSales = [];
    this.paginatedSales = [];
    this.reportGenerated = false;
    this.resetPagination();
  }

  private resetPagination() {
    this.currentPage = 1;
    this.rowsPerPage = 5;
    this.searchTerm = '';
  }

  regenerateReport() {
    this.reportForm.reset();
    this.resetData();
  }

  // Pagination and search methods
  getFilteredSales(): SaleModel[] {
    if (!this.searchTerm.trim()) {
      return [...this.sales];
    }
    return this.sales.filter(sale => {
      const searchLower = this.searchTerm.toLowerCase();
      return (
        sale.id.toString().includes(searchLower) ||
        sale.total.toString().includes(searchLower) ||
        sale.details.some(detail => 
          detail.product.name.toLowerCase().includes(searchLower)
        )
      );
    });
  }

  get filteredResults(): SaleModel[] {
    return this.filteredSales;
  }

  updatePagination() {
    this.filteredSales = this.getFilteredSales();
    const totalItems = this.filteredSales.length;
    const totalPages = Math.ceil(totalItems / this.rowsPerPage);
    
    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = Math.min(startIndex + this.rowsPerPage, totalItems);
    
    this.paginatedSales = this.filteredSales.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    const totalPages = Math.ceil(this.filteredSales.length / this.rowsPerPage);
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
    this.updatePagination();
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.updatePagination();
  }

  exportReport() {
    if (this.reportForm.invalid) {
      Swal.fire({
        icon: "error",
        title: "Porfavor seleccione un rango de fechas",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }

    const { startDate, endDate } = this.reportForm.value;
    const formattedStart = format(new Date(startDate), "yyyy-MM-dd'T'HH:mm:ss");
    const formattedEnd = format(new Date(endDate), "yyyy-MM-dd'T'HH:mm:ss");

    this.saleService.exportSalesReport(formattedStart, formattedEnd)
      .subscribe({
        next: (blob) => {
          if (blob.size > 0) {
            const link = document.createElement('a');
            const url = window.URL.createObjectURL(blob);
            link.href = url;
            link.download = `Reporte_ventas_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else {
            Swal.fire({
              icon: "error",
              title: "El reporte generado esta vacio",
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 1500
            });
          }
        },
        error: (err) => {
          Swal.fire({
            icon: "error",
            title: 'Failed to export sales report: ' + (err.message || 'Unknown error'),
            showConfirmButton: false,
            timerProgressBar: true,
            timer: 1500
          });
        }
      });
  }

  calculateTotalSales(): number {
    return this.sales.reduce((total, sale) => total + sale.total, 0);
  }

  calculateProductMargin(detail: SaleDetailModel): number {
    const purchasePrice = detail.purchasePriceAtSale || 0;
    const salePrice = detail.price;
    const quantity = detail.quantity;
    return (salePrice - purchasePrice) * quantity;
  }

  calculateTotalMargin(): number {
    return this.sales.reduce((totalMargin, sale) => {
      const saleMargin = sale.details.reduce((margin, detail) => {
        return margin + this.calculateProductMargin(detail);
      }, 0);
      return totalMargin + saleMargin;
    }, 0);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSales.length / this.rowsPerPage);
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