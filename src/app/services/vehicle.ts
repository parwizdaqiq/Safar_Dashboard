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
}