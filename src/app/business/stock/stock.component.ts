import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProductService } from '../../shared/services/product.service';
import { ProductModel } from '../../shared/models/product-model';
import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-stock',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.css'
})
export default class StockComponent implements OnInit {
  searchForm: FormGroup;
  addStockForm: FormGroup;
  foundProduct: ProductModel | null = null;
  searchError: string = '';
  formVisible = false;
  totalPorcentaje: number = 0;
  porcentual: number | null = null;
  valorAPorcentuar: number | null = null;
  totalPorcentajeResiduo: number = 0;
  porcentualResiduo: number | null = null;
  valorAPorcentuarResiduo: number | null = null;

  access = {
    canAddStock: false,
    canRead: false,
  };

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private menuService:MenuService
  ) {
    // Search Form
    this.searchForm = this.fb.group({
      searchTerm: ['', Validators.required]
    });

    // Add Stock Form
    this.addStockForm = this.fb.group({
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitPrice: ['', [Validators.required, Validators.min(0)]],
      unitSalePrice: ['', [Validators.required, Validators.min(0)]],
      expirationDate: ['', Validators.required]
    }, { validators: this.validatePrices });
  }

  private validatePrices(group: FormGroup) {
    const unitPrice = group.get('unitPrice')?.value;
    const unitSalePrice = group.get('unitSalePrice')?.value;

    if (unitPrice && unitSalePrice && unitSalePrice <= unitPrice) {
      return { invalidPrices: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.initializeAccess();
    this.setupPriceCalculation();
  }

  
  private setupPriceCalculation() {
    this.addStockForm.get('unitPrice')?.valueChanges.subscribe(value => {
      if (value && this.porcentual) {
        const suggestedSalePrice = value + (value * this.porcentual / 100);
        this.addStockForm.patchValue({
          unitSalePrice: Number(suggestedSalePrice.toFixed(2))
        }, { emitEvent: false });
      }
    });
  }

  private initializeAccess(): void {
    this.access = {
      canAddStock: this.menuService.hasPermission('PUT /products/{id}/add-stock'),
      canRead: this.menuService.hasPermission('GET /categories'),
    };
  }

  

  searchProduct() {
    if (this.searchForm.invalid) {
      return;
    }

    const searchTerm = this.searchForm.get('searchTerm')?.value;

    this.productService.searchProducts(searchTerm).subscribe({
      next: (products) => {
        if (products && products.length > 0) {
          // Take the first product if multiple are found
          this.foundProduct = products[0];
          this.searchError = '';
          this.toggleFormVisibility()
        } else {
          this.foundProduct = null;
          this.searchError = 'No product found';
        }
      },
      error: (err) => {
        console.error('Error searching product:', err);
        this.foundProduct = null;
        this.searchError = 'Error searching for product';
      }
    });
  }

  addStock() {
    if (this.addStockForm.invalid || !this.foundProduct) return;

    const { quantity, unitPrice, unitSalePrice, expirationDate } = this.addStockForm.value;

    this.productService.addStock(
      this.foundProduct.id,
      quantity,
      unitPrice,
      unitSalePrice,
      expirationDate
    ).subscribe({
      next: (updatedProduct) => {
        Swal.fire({
          icon: "success",
          title: `Stock agregado al producto: ${updatedProduct.name}`,
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
        this.resetForms();
      },
      error: (err) => {
        Swal.fire({
          icon: "error",
          title: `Error al agregar stock: ${err.message}`,
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      }
    });
    this.toggleFormVisibility();
  }

  private resetForms() {
    this.searchForm.reset();
    this.addStockForm.reset();
    this.foundProduct = null;
    this.searchError = '';
  }

  resetSearch() {
    this.resetForms();
    this.searchForm.reset();
    this.foundProduct = null;
    this.searchError = '';
    this.formVisible = false;
  }

  toggleFormVisibility(): void {
    this.formVisible = !this.formVisible;
  }

  calcularValor() {

  }

  calcularPorcentaje(): void {
    if (this.valorAPorcentuar !== null && this.porcentual !== null) {
      this.totalPorcentaje = (this.valorAPorcentuar * this.porcentual) / 100;
      
      const currentUnitPrice = this.addStockForm.get('unitPrice')?.value;
      if (currentUnitPrice) {
        const suggestedSalePrice = currentUnitPrice + (currentUnitPrice * this.porcentual / 100);
        this.addStockForm.patchValue({
          unitSalePrice: Number(suggestedSalePrice.toFixed(2))
        });
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Ingrese el valor y porcentaje",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
    }
  }

  calcularPorcentajeResiduo(): void {
    if (this.valorAPorcentuarResiduo !== null && this.porcentualResiduo !== null) {
      const total = (this.valorAPorcentuarResiduo * this.porcentualResiduo) / 100;
      this.totalPorcentajeResiduo = this.valorAPorcentuarResiduo - total;
    } else {
      Swal.fire({
        icon: "error",
        title: "Ingrese el valor y porcentaje",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
    }
  }
}