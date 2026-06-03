import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Booking } from '../../services/booking';
import { AdminAuth } from '../../services/admin-auth';

@Component({
  selector: 'app-bookings',
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.html',
  styleUrl: './bookings.scss',
})
export class Bookings implements OnInit {
  bookings: any[] = [];
  filteredBookings: any[] = [];

  searchText = '';
  statusFilter = 'ALL';

  isLoading = false;

  constructor(
    private bookingService: Booking,
    private authService: AdminAuth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  get currentUserId(): number | null {
    return this.authService.getUserId();
  }

  get isAgency(): boolean {
    return this.authService.isAgency();
  }

  get totalBookings(): number {
    return this.bookings.length;
  }

  get confirmedBookings(): number {
    return this.bookings.filter(
      (booking: any) => booking.status === 'CONFIRMED'
    ).length;
  }

  get cancelledBookings(): number {
    return this.bookings.filter(
      (booking: any) => booking.status === 'CANCELLED'
    ).length;
  }

  get confirmedRevenue(): number {
    return this.bookings
      .filter((booking: any) => booking.status === 'CONFIRMED')
      .reduce(
        (sum: number, booking: any) => sum + Number(booking.totalPrice || 0),
        0
      );
  }

  loadBookings(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const request =
      this.isAgency && this.currentUserId
        ? this.bookingService.getAgencyBookings(this.currentUserId)
        : this.bookingService.getAllBookings();

    request.subscribe({
      next: (data: any[]) => {
        this.bookings = [...data].reverse();
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to load bookings', error);
        this.isLoading = false;
        this.cdr.detectChanges();
        alert('Failed to load bookings');
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredBookings = this.bookings.filter((booking: any) => {
      const matchesSearch =
        !search ||
        String(booking.id).includes(search) ||
        String(booking.tripId).includes(search) ||
        String(booking.passengerName || '').toLowerCase().includes(search) ||
        String(booking.passengerPhone || '').toLowerCase().includes(search) ||
        String(booking.bookingGroupId || '').toLowerCase().includes(search);

      const matchesStatus =
        this.statusFilter === 'ALL' || booking.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });

    this.cdr.detectChanges();
  }

  cancelBooking(booking: any): void {
    if (booking.status === 'CANCELLED') return;

    const confirmed = confirm(
      `Cancel booking #${booking.id} for ${booking.passengerName || 'Passenger'}?`
    );

    if (!confirmed) return;

    this.bookingService.cancelBooking(booking.id).subscribe({
      next: () => this.loadBookings(),
      error: (error: any) => {
        console.error('Failed to cancel booking', error);
        alert('Failed to cancel booking');
      },
    });
  }
}