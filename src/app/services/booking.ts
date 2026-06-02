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
    console.log('GET BOOKINGS URL:', this.apiUrl);

    return this.http.get<any[]>(this.apiUrl).pipe(
      tap((data) => {
        console.log('BOOKINGS RESPONSE:', data);
      })
    );
  }
}