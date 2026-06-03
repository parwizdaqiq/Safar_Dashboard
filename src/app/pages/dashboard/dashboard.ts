import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Booking } from '../../services/booking';
import { Route } from '../../services/route';
import { Trip } from '../../services/trip';
import { Vehicle } from '../../services/vehicle';
import { AdminAuth } from '../../services/admin-auth';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
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

  incomeChart: any[] = [];
  bookingChart: any[] = [];
  recentBookings: any[] = [];

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
        this.activeTrips = trips.filter((trip) => trip.active === true).length;
        this.totalBookings = bookings.length;

        this.cancelledBookings = bookings.filter(
          (booking) => booking.status === 'CANCELLED'
        ).length;

        this.confirmedBookings = bookings.filter(
          (booking) => booking.status === 'CONFIRMED'
        ).length;

        this.totalRevenue = bookings
          .filter((booking) => booking.status === 'CONFIRMED')
          .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

        this.totalRefund = bookings
          .filter((booking) => booking.status === 'CANCELLED')
          .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0);

        this.totalVehicles = vehicles.length;
        this.totalRoutes = isAgency ? this.uniqueRoutes(trips) : routes.length;
        this.totalUsers = this.uniqueUsers(bookings);
        this.totalEmployees = 0;
        this.totalExpenses = 0;

        this.recentBookings = [...bookings].reverse().slice(0, 6);

        this.buildMonthlyCharts(bookings);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load dashboard stats', error);
      },
    });
  }

  uniqueUsers(bookings: any[]): number {
    const ids = new Set();

    bookings.forEach((booking) => {
      if (booking.userId) {
        ids.add(booking.userId);
      }
    });

    return ids.size;
  }

  uniqueRoutes(trips: any[]): number {
    const routeIds = new Set();

    trips.forEach((trip) => {
      if (trip.routeId) {
        routeIds.add(trip.routeId);
      }
    });

    return routeIds.size;
  }

  buildMonthlyCharts(bookings: any[]): void {
    const income = Array(12).fill(0);
    const expenses = Array(12).fill(0);
    const booked = Array(12).fill(0);
    const cancelled = Array(12).fill(0);

    bookings.forEach((booking) => {
      const dateValue =
        booking.createdAt ||
        booking.departureDate ||
        booking.bookingDate ||
        null;

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
      incomeHeight: Math.max(
        (income[index] / maxIncome) * 100,
        income[index] > 0 ? 8 : 0
      ),
      expenseHeight: Math.max(
        (expenses[index] / maxIncome) * 100,
        expenses[index] > 0 ? 8 : 0
      ),
    }));

    this.bookingChart = this.months.map((month, index) => ({
      month,
      booked: booked[index],
      cancelled: cancelled[index],
      bookedHeight: Math.max(
        (booked[index] / maxBooking) * 100,
        booked[index] > 0 ? 8 : 0
      ),
      cancelledHeight: Math.max(
        (cancelled[index] / maxBooking) * 100,
        cancelled[index] > 0 ? 8 : 0
      ),
    }));
  }
}