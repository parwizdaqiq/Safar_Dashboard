import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminAuth {
  private baseUrl = 'http://localhost:8800/api/auth';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, {
      email: email.trim(),
      password: password.trim(),
    });
  }

  saveSession(user: any): void {
    localStorage.setItem('adminUser', JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  logout(): void {
    localStorage.removeItem('adminUser');
  }
}