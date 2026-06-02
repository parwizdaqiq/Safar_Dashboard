import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Booking } from '../../services/booking';

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

  constructor(private bookingService: Booking) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;

    this.bookingService.getAllBookings().subscribe({
      next: (data) => {
        this.bookings = data.reverse();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load bookings', error);
        this.isLoading = false;
        alert('Failed to load bookings');
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredBookings = this.bookings.filter((booking) => {
      const matchesSearch =
        !search ||
        String(booking.id).includes(search) ||
        String(booking.passengerName || '').toLowerCase().includes(search) ||
        String(booking.passengerPhone || '').toLowerCase().includes(search) ||
        String(booking.bookingGroupId || '').toLowerCase().includes(search);

      const matchesStatus =
        this.statusFilter === 'ALL' || booking.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  cancelBooking(booking: any): void {
    if (booking.status === 'CANCELLED') return;

    const confirmed = confirm(
      `Cancel booking #${booking.id} for ${booking.passengerName}?`
    );

    if (!confirmed) return;

    this.bookingService.cancelBooking(booking.id).subscribe({
      next: () => {
        this.loadBookings();
      },
      error: (error) => {
        console.error('Failed to cancel booking', error);
        alert('Failed to cancel booking');
      },
    });
  }

  getTotalConfirmedRevenue(): number {
    return this.filteredBookings
      .filter((booking) => booking.status === 'CONFIRMED')
      .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);
  }
}