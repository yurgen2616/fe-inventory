import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductModel } from '../../shared/models/product-model';
import { SaleService } from '../../shared/services/sale.service';
import { ProductService } from '../../shared/services/product.service';
import { Observable } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { map, startWith } from 'rxjs/operators';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { MatIconModule } from '@angular/material/icon';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import BarcodeScannerComponent from '../../shared/components/barcode-scanner/barcode-scanner.component';

import 'sweetalert2/src/sweetalert2.scss';
import Swal from 'sweetalert2';
import { MenuService } from '../../shared/services/menu.service';

@Component({
  selector: 'app-sale',
  templateUrl: './sale.component.html',
  styleUrls: ['./sale.component.css'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ZXingScannerModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    BarcodeScannerComponent
  ]
})
export default class SaleComponent implements OnInit {
  saleForm: FormGroup;
  products: ProductModel[] = [];
  filteredProducts: Observable<ProductModel[]> | null = null;
  selectedProducts: any[] = [];
  totalSale: number = 0;
  specialServicePrice: number | null = null;

  access = {
    canCreate: false,
    canSearch: false,
  };

  @ViewChild(BarcodeScannerComponent) barcodeScanner!: BarcodeScannerComponent;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private productService: ProductService,
    private menuService:MenuService,
  ) {
    this.saleForm = this.fb.group({
      product: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      priceType: ['salePrice', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.initializeAccess();
  }

  private initializeAccess(): void {
    this.access = {
      canCreate: this.menuService.hasPermission('POST /sales'),
      canSearch: this.menuService.hasPermission('GET /sales/search'),
    };
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.setupProductFiltering();
      },
      error: (error) => {
        console.error('Error loading products', error);
      }
    });
  }

  setupProductFiltering(): void {
    this.filteredProducts = this.saleForm.get('product')?.valueChanges.pipe(
      startWith(''),
      map(value => {
        if (value && typeof value === 'object') {
          return this.products;
        }
        return this.filterProducts(value || '');
      })
    ) || null;
  }

  filterProducts(value: string): ProductModel[] {
    const filterValue = value.trim().toLowerCase();

    return this.products.filter(product =>
      product.name.toLowerCase().includes(filterValue) ||
      product.barcode.toLowerCase().includes(filterValue)
    );
  }

  displayProduct(product?: ProductModel): string {
    if (!product || typeof product !== 'object') {
      return '';
    }
    return `${product.name} (${product.barcode})`;
  }

  addProductToSale(): void {
    const selectedProduct = this.saleForm.get('product')?.value;

    if (typeof selectedProduct === 'string') {
      const foundProduct = this.products.find(product =>
        product.barcode.toLowerCase() === selectedProduct.toLowerCase()
      );

      if (!foundProduct) {
        Swal.fire({
          icon: "error",
          title: "Producto no encontrado, Verifique el codigo de barras",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
        return;
      }

      this.saleForm.get('product')?.setValue(foundProduct);
    }

    const validProduct = this.saleForm.get('product')?.value;
    if (!validProduct || typeof validProduct !== 'object') {
      Swal.fire({
        icon: "error",
        title: "Por favor seleccione un producto ovalido",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }

    if (validProduct.stock <= 0) {
      Swal.fire({
        icon: "error",
        title: "No se puede agregar un producto sin stock disponible",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }

    if (this.saleForm.valid) {
      const selectedProduct = this.saleForm.get('product')?.value;
      const quantity = this.saleForm.get('quantity')?.value;
      const priceType = this.saleForm.get('priceType')?.value;

      if (!selectedProduct) return;

      let price: number;
      switch (priceType) {
        case 'wholesalePrice':
          price = selectedProduct.wholesalePrice;
          break;
        case 'purchasePrice':
          price = selectedProduct.purchasePrice;
          break;
        case 'salePrice':
        default:
          price = selectedProduct.salePrice;
      }

      if (quantity > selectedProduct.stock) {
        Swal.fire({
          icon: "error",
          title: `No hay suficiente stock. Stock disponible: ${selectedProduct.stock}`,
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
        return;
      }

      if (price <= 0) {
        Swal.fire({
          icon: "error",
          title: "No se pueden realizar ventas con precios negativos o cero.",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
        return;
      }

      const subtotal = price * quantity;
      const priceTypeName = this.getPriceTypeName(priceType);

      const existingProductIndex = this.selectedProducts.findIndex(
        item => item.product.id === selectedProduct.id && item.priceType === priceTypeName
      );

      if (existingProductIndex !== -1) {
        const totalQuantity = this.selectedProducts[existingProductIndex].quantity + quantity;

        if (totalQuantity > selectedProduct.stock) {
          Swal.fire({
            icon: "error",
            title: `La cantidad total supera el stock disponible. Stock restante: ${selectedProduct.stock}`,
            showConfirmButton: false,
            timerProgressBar: true,
            timer: 1500
          });
          return;
        }

        this.selectedProducts[existingProductIndex].quantity = totalQuantity;
        this.selectedProducts[existingProductIndex].subtotal += subtotal;
        this.selectedProducts[existingProductIndex].price = price; 
      } else {
        this.selectedProducts.push({
          product: selectedProduct,
          quantity: quantity,
          price: price, 
          priceType: priceTypeName,
          subtotal: subtotal,
          maxStock: selectedProduct.stock,
          originalPriceType: priceType 
        });
      }

      this.calculateTotal();

      this.saleForm.get('product')?.reset();
      this.saleForm.get('quantity')?.setValue(1);
    }
  }

  updateItemPrice(item: any): void {
    let newPrice: number;
    switch (item.priceType) {
      case 'wholesalePrice':
        newPrice = item.product.wholesalePrice;
        break;
      case 'purchasePrice':
        newPrice = item.product.purchasePrice;
        break;
      case 'salePrice':
      default:
        newPrice = item.product.salePrice;
    }

    item.price = newPrice;
    item.subtotal = newPrice * item.quantity;
    this.calculateTotal();
  }

  getPriceTypeName(priceType: string): string {
    const priceTypeNames: Record<string, string> = {
      wholesalePrice: 'Precio al por mayor',
      salePrice: 'Precio al por menor',
      purchasePrice: 'Precio de compra'
    };

    return priceTypeNames[priceType] || 'Precio desconocido';
  }

  calculateTotal(): void {
    this.totalSale = this.selectedProducts.reduce((total, item) =>
      total + item.subtotal, 0).toFixed(2);
  }

  processSale(): void {
    if (this.selectedProducts.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Debe agregar al menos un producto a la venta",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }
  
    // Validar stock antes de procesar
    for (const item of this.selectedProducts) {
      if (item.quantity > item.maxStock) {
        Swal.fire({
          icon: "error",
          title: `Stock insuficiente para ${item.product.name}. Stock disponible: ${item.maxStock}`,
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 2000
        });
        return;
      }
    }
  
    // Validar precios
    for (const item of this.selectedProducts) {
      if (item.price <= 0) {
        Swal.fire({
          icon: "error",
          title: `Precio inválido para ${item.product.name}`,
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 2000
        });
        return;
      }
    }
  
    const saleDetails = this.selectedProducts.map(item => ({
      product: {
        id: item.product.id
      },
      quantity: item.quantity,
      price: item.price,
      priceType: item.originalPriceType || 'specialService',
      subtotal: item.subtotal,
      location: item.product.location,
      isSpecialService: item.originalPriceType === 'specialService',
      specialServicePrice: item.originalPriceType === 'specialService' ? item.price : null
    }));
  
    console.log('Sale Payload:', JSON.stringify({
      details: saleDetails,
      total: this.totalSale
    }, null, 2));
  
    // Mostrar loading mientras se procesa
    Swal.fire({
      title: 'Procesando venta',
      text: 'Por favor espere...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  
    this.saleService.createSale(saleDetails).subscribe({
      next: (createdSale) => {
        Swal.close(); // Cerrar el loading
        console.log('Sale created successfully', createdSale);
  
        const updatedProducts = this.selectedProducts.map(item => ({
          productName: item.product.name,
          soldQuantity: item.quantity,
          remainingStock: item.originalPriceType !== 'specialService'
            ? item.product.stock - item.quantity
            : 'N/A'
        }));
  
        let snackBarMessage = 'Venta procesada exitosamente. Productos vendidos:<br>';
        updatedProducts.forEach(product => {
          snackBarMessage += `
            <div>
              <strong>${product.productName}</strong> - Vendido: ${product.soldQuantity}
              ${product.remainingStock !== 'N/A'
                ? `- Stock restante: ${product.remainingStock}`
                : '(Servicio especial)'}
            </div>
            <hr/>
          `;
        });
  
        this.selectedProducts = [];
        this.totalSale = 0;
        
        Swal.fire({
          title: "<strong>Venta procesada exitosamente</strong>",
          icon: "success",
          html: snackBarMessage,
          showCloseButton: true,
          focusConfirm: false,
          confirmButtonText: `
            <i class="fa fa-thumbs-up"></i> ¡Genial!
          `,
          customClass: {
            confirmButton: 'mx-auto mb-2 bg-green-500 border border-green-500 px-5 py-2 text-sm shadow-sm font-medium tracking-wider text-white rounded-full hover:shadow-lg hover:bg-green-600',
          },
          buttonsStyling: false,
          timer: 10000,
          timerProgressBar: true
        });
      },
      error: (error) => {
        console.error('Error processing sale:', error);
        Swal.fire({
          icon: "error",
          title: error.message || "Error al procesar la venta. Por favor, verifique los datos.",
          showConfirmButton: true,
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  removeProductFromSale(index: number): void {
    this.selectedProducts.splice(index, 1);
    this.calculateTotal();
  }

  decreaseQuantity(index: number): void {
    const currentItem = this.selectedProducts[index];
    if (currentItem.quantity > 1) {
      currentItem.quantity--;
      currentItem.subtotal = currentItem.price * currentItem.quantity;
      this.calculateTotal();
    }
  }

  increaseQuantity(index: number): void {
    const currentItem = this.selectedProducts[index];

    if (currentItem.quantity + 1 > currentItem.maxStock) {
      Swal.fire({
        icon: "error",
        title: `No puede agregar más unidades. Stock máximo: ${currentItem.maxStock}`,
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }

    currentItem.quantity++;
    currentItem.subtotal = currentItem.price * currentItem.quantity;
    this.calculateTotal();
  }

  onQuantityChange(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);
    const currentItem = this.selectedProducts[index];

    if (newQuantity > currentItem.maxStock) {
      Swal.fire({
        icon: "error",
        title: (`La cantidad no puede superar el stock disponible. Stock máximo: ${currentItem.maxStock}`),
        showConfirmButton: false,
timerProgressBar: true,
        timer: 1500
      });
      currentItem.quantity = currentItem.maxStock;
    } else if (newQuantity > 0) {
      currentItem.quantity = newQuantity;
      currentItem.subtotal = currentItem.price * newQuantity;
    }

    this.calculateTotal();
  }

  validateInput(event: Event, index: number): void {
    const inputElement = event.target as HTMLInputElement;
    const newValue = inputElement.value.replace(/[^0-9]/g, '');

    if (newValue === '' || parseInt(newValue, 10) < 1) {
      inputElement.value = '1';
      this.selectedProducts[index].quantity = 1; 
    } else {
      inputElement.value = newValue; 
      this.selectedProducts[index].quantity = parseInt(newValue, 10);
    }

    this.calculateTotal();
  }

  preventNonNumeric(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];
    const isNumber = /^[0-9]$/.test(event.key);

    if (!isNumber && !allowedKeys.includes(event.key)) {
      event.preventDefault(); 
    }
  }

  onProductScanned(product: ProductModel) {
    this.saleForm.get('product')?.setValue(product);

    this.addProductToSale();
  }

  toggleScanner(): void {
    if (this.barcodeScanner) {
      this.barcodeScanner.toggleScanner();
    }
  }

  onProductInputEnter() {
    const productControl = this.saleForm.get('product');

    if (!productControl) {
      return;
    }

    const selectedProduct = productControl.value;

    if (typeof selectedProduct === 'string') {
      const trimmedInput = selectedProduct.trim().toLowerCase();
      const matchedProduct = this.products.find(
        product =>
          product.name.toLowerCase() === trimmedInput ||
          product.barcode.toLowerCase() === trimmedInput
      );

      if (matchedProduct) {
        productControl.setValue(matchedProduct);
        this.addProductToSale();
      } else {
        Swal.fire({
          icon: "error",
          title: "Producto no encontrado",
          showConfirmButton: false,
          timerProgressBar: true,
          timer: 1500
        });
      }
    }
    else if (selectedProduct && typeof selectedProduct === 'object') {
      this.addProductToSale();
    }
  }

  addSpecialServiceToSale(): void {
    if (!this.specialServicePrice || this.specialServicePrice <= 0) {
      Swal.fire({
        icon: "error",
        title: "Por favor, ingrese un precio válido.",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }

    const specialServiceProduct = this.products.find(
      product => product.barcode === "00000000000000000000"
    );

    if (!specialServiceProduct) {
      Swal.fire({
        icon: "error",
        title: "Producto especial no encontrado.",
        showConfirmButton: false,
        timerProgressBar: true,
        timer: 1500
      });
      return;
    }

    this.saleForm.patchValue({
      product: {
        ...specialServiceProduct,
        salePrice: this.specialServicePrice
      },
      quantity: 1,
      priceType: 'salePrice'
    });

    this.addProductToSale();

    this.specialServicePrice = null;
  }

  
  showPaymentModal(): void {
    Swal.fire({
      title: 'Procesar Pago',
      html: `
        <div class="mb-4">
          <p class="text-lg font-bold mb-4">Total a pagar: $${this.totalSale.toString()}</p>
          
          <div class="relative z-0 w-full mb-5">
            <input 
              type="number" 
              id="payment"
              placeholder=" "
              class="pt-3 pb-2 pl-5 block w-full px-0 mt-0 bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 focus:border-black border-gray-200"
              min="0" 
              step="0.01"
            />
            <div class="absolute top-0 left-0 mt-3 ml-1 text-gray-400">$</div>
            <label for="payment" class="absolute duration-300 top-3 left-5 -z-1 origin-0 text-gray-500">Monto recibido</label>
            <div id="input-error" class="text-sm text-red-600 mt-1 hidden">El monto es requerido</div>
          </div>

          <div id="change" class="mt-4 text-lg font-bold text-green-600"></div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Venta',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      customClass: {
        confirmButton: 'bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 mx-2',
        cancelButton: 'bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 mx-2',
        popup: 'payment-modal'
      },
      buttonsStyling: false,
      didOpen: () => {
        const paymentInput = document.getElementById('payment') as HTMLInputElement;
        const changeDiv = document.getElementById('change');
        const errorDiv = document.getElementById('input-error');
        
        // Add floating label behavior
        const style = document.createElement('style');
        style.textContent = `
          .payment-modal input:not(:placeholder-shown) + div + label,
          .payment-modal input:focus + div + label {
            transform: translateY(-1.5rem) scale(0.75);
            background-color: white;
            padding: 0 0.2em;
          }
          .payment-modal input:focus {
            border-color: black;
          }
          .payment-modal input::-webkit-outer-spin-button,
          .payment-modal input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .payment-modal input[type=number] {
            -moz-appearance: textfield;
          }
          .payment-modal .-z-1 {
            z-index: -1;
          }
        `;
        document.head.appendChild(style);
        
        paymentInput.addEventListener('input', () => {
          const payment = parseFloat(paymentInput.value);
          const total = parseFloat(this.totalSale.toString());
          
          if (paymentInput.value === '') {
            errorDiv!.classList.remove('hidden');
            changeDiv!.textContent = '';
          } else {
            errorDiv!.classList.add('hidden');
            
            if (!isNaN(payment) && payment >= total) {
              const change = (payment - total).toFixed(2);
              changeDiv!.textContent = `Cambio a devolver: $${change}`;
              changeDiv!.classList.remove('text-red-600');
              changeDiv!.classList.add('text-green-600');
            } else {
              changeDiv!.textContent = 'Monto insuficiente';
              changeDiv!.classList.remove('text-green-600');
              changeDiv!.classList.add('text-red-600');
            }
          }
        });

        // Auto focus the input
        paymentInput.focus();
      },
      preConfirm: () => {
        const paymentInput = document.getElementById('payment') as HTMLInputElement;
        const payment = parseFloat(paymentInput.value);
        const total = parseFloat(this.totalSale.toString());

        if (!payment || isNaN(payment)) {
          Swal.showValidationMessage('Por favor ingrese el monto recibido');
          return false;
        }

        if (payment < total) {
          Swal.showValidationMessage('El monto recibido es menor al total de la venta');
          return false;
        }

        return {
          payment: payment,
          change: (payment - total).toFixed(2)
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.processSale();
      }
    });
  }

}
