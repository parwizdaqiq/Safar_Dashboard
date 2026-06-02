import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Route {
  private apiUrl = 'http://localhost:8800/api/routes';

  constructor(private http: HttpClient) {}

  getAllRoutes() {
    return this.http.get<any[]>(this.apiUrl);
  }

  createRoute(route: any) {
    return this.http.post<any>(this.apiUrl, route);
  }

  updateRoute(id: number, route: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, route);
  }

  activateRoute(id: number) {
    return this.http.put<any>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateRoute(id: number) {
    return this.http.put<any>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}