import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Vehicle {
  private apiUrl = 'http://localhost:8800/api/vehicles';

  constructor(private http: HttpClient) {}

  getAllVehicles() {
    return this.http.get<any[]>(this.apiUrl);
  }

  createVehicle(vehicle: any) {
    return this.http.post<any>(this.apiUrl, vehicle);
  }

  updateVehicle(id: number, vehicle: any) {
    return this.http.put<any>(`${this.apiUrl}/${id}`, vehicle);
  }

  activateVehicle(id: number) {
    return this.http.put<any>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateVehicle(id: number) {
    return this.http.put<any>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}