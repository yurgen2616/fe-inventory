import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'roleFormat',
  standalone: true
})
export class RoleFormatPipe implements PipeTransform {
  transform(value: string): string {
    // Si el valor es null o undefined, retorna una cadena vacía
    if (!value) return '';
    
    // Elimina el prefijo 'ROLE_' si existe y convierte a mayúsculas
    return value.replace('ROLE_', '').toUpperCase();
  }
}