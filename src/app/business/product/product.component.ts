import { Component, OnInit } from '@angular/core';
import { format } from 'date-fns';
import { ProductModel } from '../../shared/models/product-model';
import { ProductService } from '../../shared/services/product.service';
import { CategoryService } from '../../shared/services/category.service';
import { DistributorService } from '../../shared/services/distributor.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { CategoryModel } from '../../shared/models/category-model';
import { DistributorModel } from '../../shared/models/distributor-models';
import { SalesFormModel } from '../../shared/models/salesForm-model';
import { SalesFormService } from '../../shared/services/salesForm.service';
import { Observable } from 'rxjs';

import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { NgFor, NgIf } from '@angular/common';
import { HighlightPipe } from '../../shared/pipe/highlight.pipe';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-product',
  imports: [NgFor, NgIf, FormsModule, ReactiveFormsModule,HighlightPipe],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export default class ProductComponent implements OnInit {

  listProducts: ProductModel[] = [];
  formProduct: FormGroup = new FormGroup({});
  formAddStock: FormGroup = new FormGroup({});

  listCategories: CategoryModel[] = [];
  listDistributors: DistributorModel[] = [];
  listSalesForms: SalesFormModel[] = [];

  isUpdate: boolean = false;
  formVisible = false;
  detailVisible = false;
  stockFormVisible = false;
  selectedProduct: ProductModel | null = null;
  selectedDetailProduct: ProductModel | null = null;
  searchTerm: string = '';

  Math = Math;

  currentPage: number = 1; 
  rowsPerPage: number = 5; 
  filteredProducts: ProductModel[] = [];
  paginatedTables: ProductModel[] = []; 

  access = {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canSearch: false,
    canReadOne: false,
    canExport: false,
    canAddStock: false,
    canWarnExpiration: false,
  };

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private distributorService: DistributorService,
    private salesFormService: SalesFormService,
    private menuService:MenuService,
  ) { 
  }

  ngOnInit(): void {
    this.list();  // Load products
    this.loadDropdownData();  // Load dropdown data
    this.initForms();  // Initialize forms
    this.initializeAccess();
  }

  private initializeAccess(): void {
    this.access = {
      canCreate: this.menuService.hasPermission('POST /products'),
      canRead: this.menuService.hasPermission('GET /products'),
      canUpdate: this.menuService.hasPermission('PUT /products/{id}'),
      canDelete: this.menuService.hasPermission('DELETE /products/{id}'),
      canSearch: this.menuService.hasPermission('GET /products/search'),
      canExport: this.menuService.hasPermission('GET /products/export'),
      canAddStock: this.menuService.hasPermission('PUT /products/{id}/add-stock'),
      canReadOne: this.menuService.hasPermission('GET /products/{id}'),
      canWarnExpiration: this.menuService.hasPermission('GET /products/expiration-warnings'),
    };
  }

  initForms() {
    // Product Form
    this.formProduct = new FormGroup({
      id: new FormControl(''),
      barcode: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]),
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]),
      purchasePrice: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      salePrice: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      wholesalePrice: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      stock: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      minimumStock: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      location: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]),
      category: new FormControl('', Validators.required),
      distributor: new FormControl('', Validators.required),
      salesForm: new FormControl('', Validators.required),
      expirationDate: new FormControl('')
    });

    // Add Stock Form
    this.formAddStock = new FormGroup({
      productId: new FormControl('', Validators.required),
      quantity: new FormControl('', [
        Validators.required,
        Validators.min(1)
      ]),
      unitPrice: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      unitSalePrice: new FormControl('', [
        Validators.required,
        Validators.min(0)
      ]),
      expirationDate: new FormControl('')
    });
  }

  getProductById(id: number): Observable<ProductModel> {
    return this.productService.getProductById(id);
  }

  loadDropdownData() {
    this.categoryService.getCategories().subscribe(resp => {
      this.listCategories = resp;
    });

    this.distributorService.getDistributors().subscribe(resp => {
      this.listDistributors = resp;
    });

    this.salesFormService.getSalesForms().subscribe(resp => {
      this.listSalesForms = resp;
    });
  }

  toggleFormVisibility(): void {
    this.formVisible = !this.formVisible;
    if (!this.formVisible) {
      this.resetForm();
    }
  }
  
  toggleDetailVisibility(): void {
    this.detailVisible = !this.detailVisible;
  }

  toggleStockFormVisibility(): void {
    this.stockFormVisible = !this.stockFormVisible;
    if (!this.stockFormVisible) {
      this.formAddStock.reset();
    }
  }

  list() {
    this.productService.getProducts().subscribe(resp => {
      if (resp) {
        this.listProducts = resp;
        this.updatePagination();
      }
    });
  }

  save() {
    if (this.formProduct.invalid) {
      return;
    }

    const productData = { ...this.formProduct.value };
    // Convert IDs to objects for backend
    productData.category = { id: productData.category };
    productData.distributor = { id: productData.distributor };
    productData.salesForm = { id: productData.salesForm };

    this.productService.createProduct(productData).subscribe({
      next: () => {
        this.list();
        this.formProduct.reset();
        Swal.fire({
          icon: "success",
          title: "Producto <b>creado</b> con exito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo crear el producto",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      }
    });
  }

  update() {
    if (this.formProduct.invalid) {
      return;
    }

    const productData = { ...this.formProduct.value };
    // Convert IDs to objects for backend
    productData.category = { id: productData.category };
    productData.distributor = { id: productData.distributor };
    productData.salesForm = { id: productData.salesForm };

    this.productService.updateProduct(productData.id, productData).subscribe({
      next: () => {
        this.list();
        this.formProduct.reset();
        this.toggleFormVisibility();
        Swal.fire({
          icon: "success",
          title: "Producto <b>actualizado</b> con exito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo actualizar el producto",
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
        este <b>Producto</b>?
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
  }).then((result) =>{if(result.isConfirmed){

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.listProducts = this.listProducts.filter(product => product.id !== id);
        this.updatePagination();
        Swal.fire({
          icon: "success",
          title: "Producto <b>eliminado</b> con exito!",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: "No se pudo eliminar el producto",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      }
    });
  }})
  }

  newProduct() {
    this.resetForm();
    this.isUpdate = false;
    this.toggleFormVisibility();
  }

  openAddStockForm(product: ProductModel) {
    this.formAddStock.patchValue({
      productId: product.id
    });
    this.toggleStockFormVisibility();
  }

  selectItem(item: ProductModel) {
    this.isUpdate = true;
    this.selectedProduct = item;
    this.formProduct.patchValue({
      id: item.id,
      barcode: item.barcode,
      name: item.name,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      wholesalePrice: item.wholesalePrice,
      stock: item.stock,
      minimumStock: item.minimumStock,
      location: item.location,
      category: item.category.id,
      distributor: item.distributor.id,
      salesForm: item.salesForm.id,
      expirationDate: item.expirationDate
    });
    this.toggleFormVisibility();
  }

  selectDetailItem(item: ProductModel) {
    this.selectedDetailProduct = item;
    this.formProduct.patchValue({
      id: item.id,
      barcode: item.barcode,
      name: item.name,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      wholesalePrice: item.wholesalePrice,
      stock: item.stock,
      minimumStock: item.minimumStock,
      location: item.location,
      category: item.category.id,
      distributor: item.distributor.id,
      salesForm: item.salesForm.id,
      stocks: item.stocks,
      expirationDate: item.expirationDate
    });
    this.toggleDetailVisibility();
  }

  resetForm() {
    this.formProduct.reset();
    this.isUpdate = false;
    this.selectedProduct = null;
  }

  exportProductsToExcel() {
    this.productService.exportProducts().subscribe({
      next: (response: Blob) => {
        // Crear un enlace temporal para descargar el archivo
        const blob = new Blob([response], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_productos_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
        link.click();
        
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        Swal.fire({
          position: "top-end",
          icon: "error",
          title: "No se pudoeExportar el listado de productos",
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  }

  getFilteredProducts(): ProductModel[] {
    if (!this.searchTerm?.trim()) {
      return [...this.listProducts];
    }
    const searchTermLower = this.searchTerm.toLowerCase().trim();
    
    return this.listProducts.filter(product =>
      product.name.toLowerCase().includes(searchTermLower) ||
      product.barcode.toLowerCase().includes(searchTermLower) ||
      product.location.toLowerCase().includes(searchTermLower)
    );
  }
  
  updatePagination() {
    // Actualizar la lista filtrada
    this.filteredProducts = this.getFilteredProducts();
    
    const totalItems = this.filteredProducts.length;
    const totalPages = Math.ceil(totalItems / this.rowsPerPage);
    
    // Ajustar la página actual si es necesario
    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    // Calcular índices de inicio y fin
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = Math.min(startIndex + this.rowsPerPage, totalItems);
    
    // Actualizar elementos paginados
    this.paginatedTables = this.filteredProducts.slice(startIndex, endIndex);
  }

  changeRowsPerPage(rows: number) {
    this.rowsPerPage = Number(rows); // Asegurar que sea un número
    this.currentPage = 1; // Reiniciar a la primera página
    this.updatePagination();
  }

  changePage(page: number) {
    const totalPages = Math.ceil(this.filteredProducts.length / this.rowsPerPage);
    
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
  
  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.rowsPerPage);
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