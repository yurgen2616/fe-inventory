import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-table-controls',
  standalone: true,
  imports: [FormsModule, NgFor,NgIf],
  templateUrl: './table-controls.component.html'
})
export class TableControlsComponent {
  @Input() totalItems: number = 0;
  @Input() currentPage: number = 1;
  @Input() rowsPerPage: number = 5;
  @Input() searchTerm: string = '';
  @Input() rowsPerPageOptions: number[] = [5, 10, 15, 20, 50];
  @Input() searchPlaceholder: string = 'Buscar...';
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() rowsPerPageChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() searchClear = new EventEmitter<void>();

  Math = Math;

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.rowsPerPage);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  onRowsPerPageChange(rows: number): void {
    this.rowsPerPageChange.emit(Number(rows));
  }

  onSearchInput(term: string): void {
    this.searchChange.emit(term);
  }

  clearSearch(): void {
    this.searchClear.emit();
  }
}