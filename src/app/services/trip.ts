import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Trip {
  private apiUrl = 'http://localhost:8800/api/trips';

  constructor(private http: HttpClient) {}

  getAllTrips() {
    return this.http.get<any[]>(this.apiUrl);
  }
}