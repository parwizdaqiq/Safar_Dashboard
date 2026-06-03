import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class User {
  private baseUrl = 'http://localhost:8800/api/users';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl);
  }

  createUser(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  updateRole(id: number, role: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/role?role=${role}`, {});
  }
}