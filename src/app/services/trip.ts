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

  getAgencyTrips(agencyId: number) {
    return this.http.get<any[]>(
      `${this.apiUrl}/agency/${agencyId}`
    );
  }

  createTrip(trip: any) {
    return this.http.post<any>(this.apiUrl, trip);
  }

  updateTrip(id: number, trip: any) {
    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      trip
    );
  }

  activateTrip(id: number) {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/activate`,
      {}
    );
  }

  deactivateTrip(id: number) {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/deactivate`,
      {}
    );
  }
}