import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Booking } from '../../services/booking';
import { Route } from '../../services/route';
import { Trip } from '../../services/trip';
import { Vehicle } from '../../services/vehicle';
import { AdminAuth } from '../../services/admin-auth';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  totalUsers = 0;
  totalTrips = 0;
  activeTrips = 0;
  totalBookings = 0;
  cancelledBookings = 0;
  confirmedBookings = 0;
  totalVehicles = 0;
  totalRoutes = 0;
  totalRevenue = 0;
  totalRefund = 0;
  totalExpenses = 0;
  totalEmployees = 0;

  portalRole = '';
  displayName = '';
  searchTerm = '';

  selectedDate = new Date();
  selectedDateLabel = 'Today';
  selectedDateTrips: any[] = [];

  incomeChart: any[] = [];
  bookingChart: any[] = [];

  allBookings: any[] = [];
  recentBookings: any[] = [];
  activeVehicleCards: any[] = [];
  upcomingTrips: any[] = [];

  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  constructor(
    private tripService: Trip,
    private bookingService: Booking,
    private vehicleService: Vehicle,
    private routeService: Route,
    private authService: AdminAuth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.portalRole = this.authService.isAgency() ? 'Agency' : 'Admin';
    this.displayName = this.authService.getDisplayName();
    this.setSelectedDateLabel();
    this.loadStats();
  }

  loadStats(): void {
    const userId = this.authService.getUserId();
    const isAgency = this.authService.isAgency();

    forkJoin({
      trips: isAgency && userId
        ? this.tripService.getAgencyTrips(userId)
        : this.tripService.getAllTrips(),

      bookings: isAgency && userId
        ? this.bookingService.getAgencyBookings(userId)
        : this.bookingService.getAllBookings(),

      vehicles: isAgency && userId
        ? this.vehicleService.getAgencyVehicles(userId)
        : this.vehicleService.getAllVehicles(),

      routes: this.routeService.getAllRoutes(),
    }).subscribe({
      next: ({ trips, bookings, vehicles, routes }) => {
        this.totalTrips = trips.length;
        this.activeTrips = trips.filter((trip: any) => trip.active === true).length;
        this.totalBookings = bookings.length;

        this.cancelledBookings = bookings.filter(
          (booking: any) => booking.status === 'CANCELLED'
        ).length;

        this.confirmedBookings = bookings.filter(
          (booking: any) => booking.status === 'CONFIRMED'
        ).length;

        this.totalRevenue = bookings
          .filter((booking: any) => booking.status === 'CONFIRMED')
          .reduce((sum: number, booking: any) => sum + Number(booking.totalPrice || 0), 0);

        this.totalRefund = bookings
          .filter((booking: any) => booking.status === 'CANCELLED')
          .reduce((sum: number, booking: any) => sum + Number(booking.totalPrice || 0), 0);

        this.totalVehicles = vehicles.length;
        this.totalRoutes = isAgency ? this.uniqueRoutes(trips) : routes.length;
        this.totalUsers = this.uniqueUsers(bookings);
        this.totalEmployees = 0;
        this.totalExpenses = 0;

        this.allBookings = [...bookings].reverse();
        this.recentBookings = this.allBookings.slice(0, 4);
        this.activeVehicleCards = vehicles.slice(0, 3);

        this.upcomingTrips = [...trips]
          .filter((trip: any) => trip.active === true)
          .slice(0, 20);

        this.filterTripsBySelectedDate();
        this.buildMonthlyCharts(bookings);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load dashboard stats', error);
      },
    });
  }

  changeCalendarDay(direction: number): void {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + direction);

    this.selectedDate = date;
    this.setSelectedDateLabel();
    this.filterTripsBySelectedDate();
  }

  goToday(): void {
    this.selectedDate = new Date();
    this.setSelectedDateLabel();
    this.filterTripsBySelectedDate();
  }

  setSelectedDateLabel(): void {
    const today = new Date();
    const selected = new Date(this.selectedDate);

    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      this.selectedDateLabel = 'Today';
    } else if (diffDays === 1) {
      this.selectedDateLabel = 'Tomorrow';
    } else if (diffDays === -1) {
      this.selectedDateLabel = 'Yesterday';
    } else {
      this.selectedDateLabel = selected.toLocaleDateString();
    }
  }

  filterTripsBySelectedDate(): void {
    const selected = new Date(this.selectedDate);
    selected.setHours(0, 0, 0, 0);

    this.selectedDateTrips = this.upcomingTrips
      .filter((trip: any) => {
        const value =
          trip.departureDate ||
          trip.tripDate ||
          trip.date ||
          trip.createdAt ||
          null;

        if (!value) {
          return true;
        }

        const tripDate = new Date(value);
        tripDate.setHours(0, 0, 0, 0);

        return tripDate.getTime() === selected.getTime();
      })
      .slice(0, 2);
  }

  onSearch(): void {
    const value = this.searchTerm.toLowerCase().trim();

    if (!value) {
      this.recentBookings = this.allBookings.slice(0, 4);
      return;
    }

    this.recentBookings = this.allBookings
      .filter((booking: any) => {
        return (
          String(booking.passengerName || '').toLowerCase().includes(value) ||
          String(booking.fullName || '').toLowerCase().includes(value) ||
          String(booking.status || '').toLowerCase().includes(value) ||
          String(booking.id || '').toLowerCase().includes(value) ||
          String(booking.totalPrice || '').toLowerCase().includes(value) ||
          this.getBookingRoute(booking).toLowerCase().includes(value)
        );
      })
      .slice(0, 4);
  }

  uniqueUsers(bookings: any[]): number {
    const ids = new Set();

    bookings.forEach((booking: any) => {
      if (booking.userId) {
        ids.add(booking.userId);
      }
    });

    return ids.size;
  }

  uniqueRoutes(trips: any[]): number {
    const routeIds = new Set();

    trips.forEach((trip: any) => {
      if (trip.routeId) {
        routeIds.add(trip.routeId);
      }
    });

    return routeIds.size;
  }

  getVehicleName(vehicle: any): string {
    return vehicle.name || vehicle.vehicleName || vehicle.busName || vehicle.model || 'Bus';
  }

  getVehicleNumber(vehicle: any): string {
    return vehicle.plateNumber || vehicle.busNumber || vehicle.vehicleNumber || `Bus #${vehicle.id}`;
  }

  getTripTime(trip: any): string {
    return trip.departureTime || trip.startTime || trip.time || 'Time';
  }

  getTripRoute(trip: any): string {
    if (trip.routeName) return trip.routeName;

    const from = trip.fromCity || trip.source || trip.origin || trip.departureCity || 'Route';
    const to = trip.toCity || trip.destination || trip.arrivalCity || '';

    return to ? `${from} → ${to}` : from;
  }

  getTripBus(trip: any): string {
    return trip.vehicleNumber || trip.busNumber || trip.vehicleId || trip.busId || trip.id || '-';
  }

  getBookingRoute(booking: any): string {
    if (booking.routeName) return booking.routeName;

    const from = booking.fromCity || booking.source || booking.origin || 'Route';
    const to = booking.toCity || booking.destination || '';

    return to ? `${from} to ${to}` : from;
  }

  getBookingDate(booking: any): string {
    return booking.departureDate || booking.bookingDate || booking.createdAt || '-';
  }

  buildMonthlyCharts(bookings: any[]): void {
    const income = Array(12).fill(0);
    const expenses = Array(12).fill(0);
    const booked = Array(12).fill(0);
    const cancelled = Array(12).fill(0);

    bookings.forEach((booking: any) => {
      const dateValue = booking.createdAt || booking.departureDate || booking.bookingDate || null;
      let monthIndex = new Date().getMonth();

      if (dateValue) {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          monthIndex = date.getMonth();
        }
      }

      if (booking.status === 'CONFIRMED') {
        income[monthIndex] += Number(booking.totalPrice || 0);
        booked[monthIndex] += 1;
      }

      if (booking.status === 'CANCELLED') {
        expenses[monthIndex] += Number(booking.totalPrice || 0);
        cancelled[monthIndex] += 1;
      }
    });

    const maxIncome = Math.max(...income, ...expenses, 1);
    const maxBooking = Math.max(...booked, ...cancelled, 1);

    this.incomeChart = this.months.map((month, index) => ({
      month,
      income: income[index],
      expense: expenses[index],
      incomeHeight: Math.max((income[index] / maxIncome) * 100, income[index] > 0 ? 8 : 0),
      expenseHeight: Math.max((expenses[index] / maxIncome) * 100, expenses[index] > 0 ? 8 : 0),
    }));

    this.bookingChart = this.months.map((month, index) => ({
      month,
      booked: booked[index],
      cancelled: cancelled[index],
      bookedHeight: Math.max((booked[index] / maxBooking) * 100, booked[index] > 0 ? 8 : 0),
      cancelledHeight: Math.max((cancelled[index] / maxBooking) * 100, cancelled[index] > 0 ? 8 : 0),
    }));
  }
}