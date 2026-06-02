import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Booking } from '../../services/booking';
import { Route } from '../../services/route';
import { Trip } from '../../services/trip';
import { Vehicle } from '../../services/vehicle';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  totalTrips = 0;
  activeTrips = 0;
  totalBookings = 0;
  cancelledBookings = 0;
  totalVehicles = 0;
  totalRoutes = 0;
  totalRevenue = 0;

  constructor(
    private tripService: Trip,
    private bookingService: Booking,
    private vehicleService: Vehicle,
    private routeService: Route,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    forkJoin({
      trips: this.tripService.getAllTrips(),
      bookings: this.bookingService.getAllBookings(),
      vehicles: this.vehicleService.getAllVehicles(),
      routes: this.routeService.getAllRoutes(),
    }).subscribe({
      next: ({ trips, bookings, vehicles, routes }) => {
        this.totalTrips = trips.length;
        this.activeTrips = trips.filter((trip) => trip.active === true).length;

        this.totalBookings = bookings.length;
        this.cancelledBookings = bookings.filter(
          (booking) => booking.status === 'CANCELLED'
        ).length;

        this.totalRevenue = bookings
          .filter((booking) => booking.status === 'CONFIRMED')
          .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

        this.totalVehicles = vehicles.length;
        this.totalRoutes = routes.length;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load dashboard stats', error);
      },
    });
  }
}