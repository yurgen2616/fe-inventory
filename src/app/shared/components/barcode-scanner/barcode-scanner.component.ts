import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { ProductModel } from '../../models/product-model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-barcode-scanner',
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
    MatIconModule
  ],
  templateUrl: './barcode-scanner.component.html',
  styleUrl: './barcode-scanner.component.css'
})
export default class BarcodeScannerComponent implements OnInit {
  @Output() productScanned = new EventEmitter<ProductModel>();
  
  scannerActive: boolean = false;
  scannerEnabled = true;
  products: ProductModel[] = [];
  scanForm: FormGroup;

  // Supported barcode formats
  scannerFormats: BarcodeFormat[] = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_8,
    BarcodeFormat.EAN_13,
    BarcodeFormat.UPC_A,
    BarcodeFormat.DATA_MATRIX
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private snackBar: MatSnackBar, 
    private fb: FormBuilder,
    private productService: ProductService
  ) {
  // Add console logs to track initialization
  console.log('BarcodeScannerComponent initialized');
  
  // Current configuration
  console.log('Supported barcode formats:', this.scannerFormats);
  
  this.scanForm = this.fb.group({
    product: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    priceType: ['salePrice', Validators.required]
  });
  }

  ngOnInit(): void {
    this.loadProducts();
    //this.checkCameraAvailability();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error loading products', error);
        this.snackBar.open('No se pudieron cargar los productos', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  // Main scanning success method
  onScanSuccess(result: any) {
    const scannedBarcode = result?.getText ? result.getText() : result;

    if (!scannedBarcode) {
      this.snackBar.open('Código de barras no válido', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    // Find product by barcode
    const foundProduct = this.products.find(
      product => product.barcode.trim() === scannedBarcode.trim()
    );

    if (foundProduct) {
      // Emit the found product
      this.productScanned.emit(foundProduct);

      // Close scanner
      this.toggleScanner();

      // Show success message
      this.snackBar.open(`Producto encontrado: ${foundProduct.name}`, 'Cerrar', {
        duration: 3000
      });
    } else {
      // No product found
      this.snackBar.open('Producto no encontrado', 'Cerrar', {
        duration: 3000
      });
    }
  }

  // Toggle scanner visibility
  toggleScanner() {
    this.scannerActive = !this.scannerActive;

    // Reset form when opening scanner
    if (this.scannerActive) {
      this.scanForm.get('product')?.reset();
    }
  }

  // Error handling for scanner
  onScanError(error: any) {
    console.error('Detailed Scanner Error:', {
      message: error.message,
      stack: error.stack,
      type: typeof error
    });
    
    // More informative error message
    this.snackBar.open('No se pudo iniciar el escáner. Verifique los permisos de la cámara.', 'Cerrar', {
      duration: 5000
    });
  }

  checkCameraAvailability() {
    if (isPlatformBrowser(this.platformId)) {
      // Safely check for navigator and media devices
      if (navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            console.log('Camera access granted');
            this.scannerEnabled = true;
            // Close the stream to release the camera
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(err => {
            console.error('Camera access denied:', err);
            this.scannerEnabled = false;
            this.snackBar.open('No se puede acceder a la cámara. Verifique los permisos.', 'Cerrar', {
              duration: 5000
            });
          });
      } else {
        console.warn('Media devices not supported in this browser');
        this.scannerEnabled = false;
        this.snackBar.open('Su navegador no soporta acceso a la cámara.', 'Cerrar', {
          duration: 5000
        });
      }
    }
  }

  // Explicit method to start scanning
  scanBarcode() {
    if (!this.scannerEnabled) {
      this.toggleScanner();
    }
  }
}