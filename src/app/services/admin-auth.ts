import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminAuth {
  private baseUrl = 'http://localhost:8800/api/auth';
  private storageKey = 'adminUser';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, {
      email: email.trim(),
      password: password.trim(),
    });
  }

  saveSession(user: any): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem(this.storageKey);
    return user ? JSON.parse(user) : null;
  }

  getUserId(): number | null {
    const user = this.getUser();
    return user?.userId ?? null;
  }

  getRole(): string | null {
    const user = this.getUser();
    return user?.role ?? null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isAgency(): boolean {
    return this.getRole() === 'AGENCY';
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }
}