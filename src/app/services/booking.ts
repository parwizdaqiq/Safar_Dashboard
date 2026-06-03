import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class Booking {
  private apiUrl = 'http://localhost:8800/api/bookings';

  constructor(private http: HttpClient) {}

  getAllBookings() {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap((data) => {
        console.log('BOOKINGS RESPONSE:', data);
      })
    );
  }

  getAgencyBookings(agencyId: number) {
    return this.http.get<any[]>(
      `${this.apiUrl}/agency/${agencyId}`
    );
  }

  cancelBooking(id: number) {
    return this.http.put<any>(
      `${this.apiUrl}/${id}/cancel`,
      {}
    );
  }
}