import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Booking } from '../../services/booking';
import { Trip } from '../../services/trip';
import { Vehicle } from '../../services/vehicle';
import { Route } from '../../services/route';
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

  trips: any[] = [];
  vehicles: any[] = [];
  routes: any[] = [];

  busPlateNumbers: string[] = [];

  searchText = '';
  sortFilter = 'RECENT';
  plateFilter = 'ALL';

  isLoading = false;

  constructor(
    private bookingService: Booking,
    private tripService: Trip,
    private vehicleService: Vehicle,
    private routeService: Route,
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

  loadBookings(): void {
    this.isLoading = true;

    const userId = this.currentUserId;
    const isAgency = this.isAgency;

    forkJoin({
      bookings:
        isAgency && userId
          ? this.bookingService.getAgencyBookings(userId)
          : this.bookingService.getAllBookings(),

      trips:
        isAgency && userId
          ? this.tripService.getAgencyTrips(userId)
          : this.tripService.getAllTrips(),

      vehicles:
        isAgency && userId
          ? this.vehicleService.getAgencyVehicles(userId)
          : this.vehicleService.getAllVehicles(),

      routes: this.routeService.getAllRoutes(),
    }).subscribe({
      next: ({ bookings, trips, vehicles, routes }) => {
        this.bookings = bookings || [];
        this.trips = trips || [];
        this.vehicles = vehicles || [];
        this.routes = routes || [];

        this.busPlateNumbers = this.getUniquePlates();
        this.applyFilters();

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load bookings', error);
        this.isLoading = false;
        this.cdr.detectChanges();
        alert('Failed to load bookings');
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    let result = this.bookings.filter((booking: any) => {
      const plate = this.getBusPlate(booking);
      const route = this.getBookingRoute(booking);

      const matchesSearch =
        !search ||
        String(booking.id || '').toLowerCase().includes(search) ||
        String(booking.tripId || '').toLowerCase().includes(search) ||
        String(booking.passengerName || '').toLowerCase().includes(search) ||
        String(booking.fullName || '').toLowerCase().includes(search) ||
        String(booking.passengerPhone || '').toLowerCase().includes(search) ||
        plate.toLowerCase().includes(search) ||
        route.toLowerCase().includes(search);

      const matchesPlate =
        this.plateFilter === 'ALL' || plate === this.plateFilter;

      return matchesSearch && matchesPlate;
    });

    result.sort((a: any, b: any) => {
      const aTime = this.getBookingDateTimeValue(a);
      const bTime = this.getBookingDateTimeValue(b);
      return this.sortFilter === 'RECENT' ? bTime - aTime : aTime - bTime;
    });

    this.filteredBookings = result;
    this.cdr.detectChanges();
  }

  getTrip(booking: any): any {
    return this.trips.find(
      (trip: any) =>
        Number(trip.id) === Number(booking.tripId) ||
        Number(trip.tripId) === Number(booking.tripId)
    );
  }

  getVehicle(booking: any): any {
    const trip = this.getTrip(booking);
    const vehicleId =
      booking.vehicleId ||
      booking.busId ||
      trip?.vehicleId ||
      trip?.busId;

    return this.vehicles.find(
      (vehicle: any) =>
        Number(vehicle.id) === Number(vehicleId) ||
        Number(vehicle.vehicleId) === Number(vehicleId)
    );
  }

  getRoute(booking: any): any {
    const trip = this.getTrip(booking);
    const routeId = booking.routeId || trip?.routeId;

    return this.routes.find(
      (route: any) =>
        Number(route.id) === Number(routeId) ||
        Number(route.routeId) === Number(routeId)
    );
  }

  getBusPlate(booking: any): string {
    const vehicle = this.getVehicle(booking);
    const trip = this.getTrip(booking);

    return (
      booking.busPlateNumber ||
      booking.plateNumber ||
      booking.vehiclePlateNumber ||
      vehicle?.plateNumber ||
      vehicle?.vehicleNumber ||
      vehicle?.busNumber ||
      trip?.plateNumber ||
      '-'
    );
  }

  getBookingRoute(booking: any): string {
    const route = this.getRoute(booking);
    const trip = this.getTrip(booking);

    const from =
      booking.fromCity ||
      trip?.fromCity ||
      route?.fromCity ||
      route?.sourceCity ||
      route?.departureCity ||
      route?.origin ||
      route?.source;

    const to =
      booking.toCity ||
      trip?.toCity ||
      route?.toCity ||
      route?.destinationCity ||
      route?.arrivalCity ||
      route?.destination;

    if (from && to) return `${from} → ${to}`;

    return booking.routeName || trip?.routeName || route?.name || 'Route';
  }

  getBookingDate(booking: any): string {
    const trip = this.getTrip(booking);

    const value =
      booking.departureDate ||
      booking.bookingDate ||
      booking.createdAt ||
      trip?.departureDate ||
      trip?.tripDate ||
      trip?.date;

    if (!value) return '-';

    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }

  getBookingTime(booking: any): string {
    const trip = this.getTrip(booking);

    return (
      booking.departureTime ||
      booking.time ||
      trip?.departureTime ||
      trip?.startTime ||
      '-'
    );
  }

  getBookingDateTimeValue(booking: any): number {
    const trip = this.getTrip(booking);

    const value =
      booking.createdAt ||
      booking.bookingDate ||
      booking.departureDate ||
      trip?.departureDate ||
      trip?.tripDate ||
      '';

    const date = new Date(value);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }

  getUniquePlates(): string[] {
    const plates = new Set<string>();

    this.bookings.forEach((booking: any) => {
      const plate = this.getBusPlate(booking);
      if (plate && plate !== '-') plates.add(plate);
    });

    return Array.from(plates);
  }

  cancelBooking(booking: any): void {
    if (booking.status === 'CANCELLED') return;

    const confirmed = confirm(
      `Cancel booking #${booking.id} for ${booking.passengerName || booking.fullName || 'Passenger'}?`
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