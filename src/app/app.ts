import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { AdminAuth } from './services/admin-auth';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('safar-admin');

  constructor(
    public router: Router,
    public authService: AdminAuth
  ) {}

  get isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  get userRole(): string {
    return this.authService.getRole() ?? '';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isAgency(): boolean {
    return this.authService.isAgency();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}