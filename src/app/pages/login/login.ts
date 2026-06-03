import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AdminAuth } from '../../services/admin-auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';

  isLoading = false;

  constructor(
    private authService: AdminAuth,
    private router: Router
  ) {}

  login(): void {
    if (!this.email.trim() || !this.password.trim()) {
      alert('Please enter email and password');
      return;
    }

    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        if (response.message !== 'Login successful') {
          this.isLoading = false;
          alert('Invalid email or password');
          return;
        }

        if (response.role !== 'ADMIN') {
          this.isLoading = false;
          alert('Access denied. Admin only.');
          return;
        }

        this.authService.saveSession(response);
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
        alert('Invalid email or password');
      },
    });
  }
}