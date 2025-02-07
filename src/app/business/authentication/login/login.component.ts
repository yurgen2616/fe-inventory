import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export default class LoginComponent {
  username: string = '';
  password: string = '';
  showPassword = false;

  constructor(private authService: AuthService, private router: Router, private httpClient: HttpClient) {}

  login(): void {
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        const token = response.token;
        const payload = JSON.parse(atob(token.split('.')[1]));
  
        let role = null;
        if (payload.roles && payload.roles.length > 0) {
          role = payload.roles[0];
        }
  
        if (role === 'ROLE_ADMIN') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/sale']);
        }
      },
      error: (err) => console.error('Login failed', err)
    });
  }
}