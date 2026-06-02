import { Component, OnInit } from '@angular/core';
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
  confirmedBookings = 0;
  totalVehicles = 0;
  totalRoutes = 0;
  totalRevenue = 0;

  constructor(
    private tripService: Trip,
    private bookingService: Booking,
    private vehicleService: Vehicle,
    private routeService: Route
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.tripService.getAllTrips().subscribe({
      next: (trips) => {
        console.log('TRIPS:', trips);

        this.totalTrips = trips.length;
        this.activeTrips = trips.filter(
          (trip) => trip.active === true
        ).length;
      },
      error: (error) => {
        console.error('Failed to load trips', error);
      },
    });

    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        console.log('BOOKINGS:', bookings);

        this.totalBookings = bookings.length;

        this.cancelledBookings = bookings.filter(
          (booking) => booking.status === 'CANCELLED'
        ).length;

        this.confirmedBookings = bookings.filter(
          (booking) => booking.status === 'CONFIRMED'
        ).length;

        this.totalRevenue = bookings
          .filter((booking) => booking.status === 'CONFIRMED')
          .reduce(
            (sum, booking) =>
              sum + Number(booking.totalPrice || 0),
            0
          );

        console.log('TOTAL REVENUE:', this.totalRevenue);
      },
      error: (error) => {
        console.error('Failed to load bookings', error);
      },
    });

    this.vehicleService.getAllVehicles().subscribe({
      next: (vehicles) => {
        console.log('VEHICLES:', vehicles);
        this.totalVehicles = vehicles.length;
      },
      error: (error) => {
        console.error('Failed to load vehicles', error);
      },
    });

    this.routeService.getAllRoutes().subscribe({
      next: (routes) => {
        console.log('ROUTES:', routes);
        this.totalRoutes = routes.length;
      },
      error: (error) => {
        console.error('Failed to load routes', error);
      },
    });
  }
}