import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Vehicle } from '../../services/vehicle';
import { Booking } from '../../services/booking';
import { Trip } from '../../services/trip';
import { Route } from '../../services/route';
import { AdminAuth } from '../../services/admin-auth';

@Component({
  selector: 'app-vehicles',
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.scss',
})
export class Vehicles implements OnInit {
  vehicles: any[] = [];
  filteredVehicles: any[] = [];
  selectedVehicle: any = null;

  bookings: any[] = [];
  trips: any[] = [];
  routes: any[] = [];

  searchText = '';
  showVehicleModal = false;

  form = {
    id: null as number | null,
    vehicleType: 'BUS',
    companyName: '',
    plateNumber: '',
    seatCount: null as number | null,
  };

  isEditing = false;
  isLoading = false;
  isSaving = false;

  constructor(
    private vehicleService: Vehicle,
    private bookingService: Booking,
    private tripService: Trip,
    private routeService: Route,
    private authService: AdminAuth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setAgencyCompanyName();
    this.loadVehicles();
  }

  get currentUser(): any {
    return this.authService.getUser() || {};
  }

  get currentUserId(): number | null {
    return this.authService.getUserId();
  }

  get isAgency(): boolean {
    return this.authService.isAgency();
  }

  get agencyName(): string {
    return this.currentUser.fullName || '';
  }

  get totalVehicles(): number {
    return this.vehicles.length;
  }

  get activeVehicles(): number {
    return this.vehicles.filter((vehicle: any) => vehicle.active === true).length;
  }

  get inactiveVehicles(): number {
    return this.vehicles.filter((vehicle: any) => vehicle.active !== true).length;
  }

  get totalBuses(): number {
    return this.vehicles.filter((vehicle: any) => vehicle.vehicleType === 'BUS').length;
  }

  get totalSeats(): number {
    return this.vehicles.reduce(
      (sum: number, vehicle: any) => sum + Number(vehicle.seatCount || 0),
      0
    );
  }

  setAgencyCompanyName(): void {
    if (this.isAgency) {
      this.form.companyName = this.agencyName;
    }
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.setAgencyCompanyName();
    this.cdr.detectChanges();

    const userId = this.currentUserId;
    const isAgency = this.isAgency;

    forkJoin({
      vehicles:
        isAgency && userId
          ? this.vehicleService.getAgencyVehicles(userId)
          : this.vehicleService.getAllVehicles(),

      bookings:
        isAgency && userId
          ? this.bookingService.getAgencyBookings(userId)
          : this.bookingService.getAllBookings(),

      trips:
        isAgency && userId
          ? this.tripService.getAgencyTrips(userId)
          : this.tripService.getAllTrips(),

      routes: this.routeService.getAllRoutes(),
    }).subscribe({
      next: ({ vehicles, bookings, trips, routes }) => {
        this.vehicles = [...vehicles].reverse();
        this.bookings = bookings || [];
        this.trips = trips || [];
        this.routes = routes || [];

        this.applyFilters();
        this.selectedVehicle = this.filteredVehicles[0] || null;

        this.isLoading = false;
        this.setAgencyCompanyName();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to load vehicles', error);
        this.isLoading = false;
        this.cdr.detectChanges();
        alert('Failed to load vehicles');
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredVehicles = this.vehicles.filter((vehicle: any) => {
      return (
        !search ||
        String(vehicle.id || '').toLowerCase().includes(search) ||
        String(vehicle.vehicleType || '').toLowerCase().includes(search) ||
        String(vehicle.plateNumber || '').toLowerCase().includes(search) ||
        String(vehicle.seatCount || '').toLowerCase().includes(search) ||
        this.getVehicleRoute(vehicle).toLowerCase().includes(search)
      );
    });

    if (
      this.selectedVehicle &&
      !this.filteredVehicles.some(
        (vehicle: any) => vehicle.id === this.selectedVehicle.id
      )
    ) {
      this.selectedVehicle = this.filteredVehicles[0] || null;
    }

    this.cdr.detectChanges();
  }

  selectVehicle(vehicle: any): void {
    this.selectedVehicle = vehicle;
  }

  openAddBusModal(): void {
    this.resetForm();
    this.showVehicleModal = true;
  }

  closeVehicleModal(): void {
    this.showVehicleModal = false;
    this.resetForm();
  }

  getVehicleTrips(vehicle: any): any[] {
    return this.trips.filter((trip: any) => {
      const tripVehicleId = trip.vehicleId || trip.busId;
      return Number(tripVehicleId) === Number(vehicle.id);
    });
  }

  getVehicleRoute(vehicle: any): string {
    const trip = this.getVehicleTrips(vehicle)[0];

    if (!trip) return 'No route assigned';

    const route = this.routes.find((route: any) => {
      const routeId = route.id || route.routeId;
      return Number(routeId) === Number(trip.routeId);
    });

    const from =
      trip.fromCity ||
      trip.source ||
      trip.origin ||
      route?.fromCity ||
      route?.sourceCity ||
      route?.departureCity ||
      route?.origin ||
      route?.source;

    const to =
      trip.toCity ||
      trip.destination ||
      trip.arrivalCity ||
      route?.toCity ||
      route?.destinationCity ||
      route?.arrivalCity ||
      route?.destination;

    return from && to ? `${from} → ${to}` : route?.name || 'Route';
  }

  getBookedSeats(vehicle: any): number {
    const vehicleTripIds = this.getVehicleTrips(vehicle).map((trip: any) =>
      Number(trip.id || trip.tripId)
    );

    return this.bookings.filter((booking: any) => {
      return (
        vehicleTripIds.includes(Number(booking.tripId)) &&
        booking.status === 'CONFIRMED'
      );
    }).length;
  }

  getAvailableSeats(vehicle: any): number {
    return Math.max(
      Number(vehicle.seatCount || 0) - this.getBookedSeats(vehicle),
      0
    );
  }

  saveVehicle(): void {
    this.setAgencyCompanyName();

    if (
      !this.form.vehicleType ||
      !this.form.companyName.trim() ||
      !this.form.plateNumber.trim() ||
      !this.form.seatCount
    ) {
      alert('Please fill all fields');
      return;
    }

    if (this.isAgency && !this.currentUserId) {
      alert('Agency session not found. Please login again.');
      return;
    }

    const payload = {
      agencyId: this.isAgency ? this.currentUserId : null,
      vehicleType: this.form.vehicleType,
      companyName: this.form.companyName.trim(),
      plateNumber: this.form.plateNumber.trim(),
      seatCount: Number(this.form.seatCount),
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    const request =
      this.isEditing && this.form.id !== null
        ? this.vehicleService.updateVehicle(this.form.id, payload)
        : this.vehicleService.createVehicle(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeVehicleModal();
        this.loadVehicles();
      },
      error: (error: any) => {
        console.error('Failed to save vehicle', error);
        this.isSaving = false;
        this.cdr.detectChanges();
        alert('Failed to save vehicle');
      },
    });
  }

  editVehicle(vehicle: any): void {
    this.isEditing = true;

    this.form = {
      id: vehicle.id,
      vehicleType: vehicle.vehicleType ?? 'BUS',
      companyName: this.isAgency ? this.agencyName : vehicle.companyName ?? '',
      plateNumber: vehicle.plateNumber ?? '',
      seatCount: vehicle.seatCount ?? null,
    };

    this.selectedVehicle = vehicle;
    this.showVehicleModal = true;
    this.setAgencyCompanyName();
    this.cdr.detectChanges();
  }

  activateVehicle(id: number): void {
    this.vehicleService.activateVehicle(id).subscribe({
      next: () => this.loadVehicles(),
      error: (error: any) => {
        console.error('Failed to activate vehicle', error);
        alert('Failed to activate vehicle');
      },
    });
  }

  deactivateVehicle(id: number): void {
    this.vehicleService.deactivateVehicle(id).subscribe({
      next: () => this.loadVehicles(),
      error: (error: any) => {
        console.error('Failed to deactivate vehicle', error);
        alert('Failed to deactivate vehicle');
      },
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.isSaving = false;

    this.form = {
      id: null,
      vehicleType: 'BUS',
      companyName: this.isAgency ? this.agencyName : '',
      plateNumber: '',
      seatCount: null,
    };

    this.setAgencyCompanyName();
    this.cdr.detectChanges();
  }
}