import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuService } from './shared/services/menu.service';
import { AuthService } from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ng-fronInventario';

  constructor(
    private authService: AuthService,
    private msnuService: MenuService
  ) {}

  ngOnInit() {
    // Verificar si el usuario está autenticado y cargar sus permisos
    if (this.authService.isAuthenticated()) {
      this.msnuService.loadPermissions().subscribe({
        error: (error) => {
          console.error('Error loading permissions:', error);
          // Si hay un error cargando los permisos, podríamos considerar cerrar la sesión
          // ya que podría indicar un problema con la autenticación
          this.authService.logout();
        }
      });
    }
  }
}