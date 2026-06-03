import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Trip } from '../../services/trip';
import { Route } from '../../services/route';
import { Vehicle } from '../../services/vehicle';
import { User } from '../../services/user';
import { AdminAuth } from '../../services/admin-auth';

@Component({
  selector: 'app-trips',
  imports: [CommonModule, FormsModule],
  templateUrl: './trips.html',
  styleUrl: './trips.scss',
})
export class Trips implements OnInit {
  trips: any[] = [];
  routes: any[] = [];
  vehicles: any[] = [];
  drivers: any[] = [];

  form = {
    id: null as number | null,
    routeId: null as number | null,
    vehicleId: null as number | null,
    driverId: null as number | null,
    departureDate: '',
    departureTime: '',
    price: null as number | null,
  };

  isEditing = false;
  isLoading = false;
  isSaving = false;

  constructor(
    private tripService: Trip,
    private routeService: Route,
    private vehicleService: Vehicle,
    private userService: User,
    private authService: AdminAuth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoutes();
    this.loadVehicles();
    this.loadDrivers();
    this.loadTrips();
  }

  get currentUserId(): number | null {
    return this.authService.getUserId();
  }

  get isAgency(): boolean {
    return this.authService.isAgency();
  }

  get totalTrips(): number {
    return this.trips.length;
  }

  get activeTrips(): number {
    return this.trips.filter((trip: any) => trip.active === true).length;
  }

  get todayTrips(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.trips.filter((trip: any) => trip.departureDate === today).length;
  }

  get averagePrice(): number {
    if (this.trips.length === 0) return 0;

    const total = this.trips.reduce(
      (sum: number, trip: any) => sum + Number(trip.price || 0),
      0
    );

    return Math.round(total / this.trips.length);
  }

  loadTrips(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    const request =
      this.isAgency && this.currentUserId
        ? this.tripService.getAgencyTrips(this.currentUserId)
        : this.tripService.getAllTrips();

    request.subscribe({
      next: (data: any[]) => {
        this.trips = [...data].reverse();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to load trips', error);
        this.isLoading = false;
        alert('Failed to load trips');
        this.cdr.detectChanges();
      },
    });
  }

  loadRoutes(): void {
    this.routeService.getAllRoutes().subscribe({
      next: (data: any[]) => {
        this.routes = data.filter((route: any) => route.active === true);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to load routes', error);
        this.cdr.detectChanges();
      },
    });
  }

  loadVehicles(): void {
    const request =
      this.isAgency && this.currentUserId
        ? this.vehicleService.getAgencyVehicles(this.currentUserId)
        : this.vehicleService.getAllVehicles();

    request.subscribe({
      next: (data: any[]) => {
        this.vehicles = data.filter((vehicle: any) => vehicle.active === true);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to load vehicles', error);
        this.cdr.detectChanges();
      },
    });
  }

  loadDrivers(): void {
    if (!this.currentUserId) {
      this.drivers = [];
      return;
    }

    this.userService.getAgencyDrivers(this.currentUserId).subscribe({
      next: (data: any[]) => {
        this.drivers = data;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to load drivers', error);
        this.drivers = [];
        this.cdr.detectChanges();
      },
    });
  }

  saveTrip(): void {
    if (
      !this.form.routeId ||
      !this.form.vehicleId ||
      !this.form.driverId ||
      !this.form.departureDate ||
      !this.form.departureTime ||
      !this.form.price
    ) {
      alert('Please fill all fields');
      return;
    }

    const selectedVehicle = this.vehicles.find(
      (vehicle: any) => vehicle.id === this.form.vehicleId
    );

    if (this.isAgency && !selectedVehicle) {
      alert('You can only create trips with your own vehicles.');
      return;
    }

    const selectedDriver = this.drivers.find(
      (driver: any) => driver.id === this.form.driverId
    );

    if (!selectedDriver) {
      alert('Please select a valid driver');
      return;
    }

    const payload = {
      routeId: Number(this.form.routeId),
      vehicleId: Number(this.form.vehicleId),
      driverId: Number(this.form.driverId),
      departureDate: this.form.departureDate,
      departureTime: this.form.departureTime,
      price: Number(this.form.price),
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    const request =
      this.isEditing && this.form.id !== null
        ? this.tripService.updateTrip(this.form.id, payload)
        : this.tripService.createTrip(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.resetForm();
        this.loadTrips();
      },
      error: (error: any) => {
        console.error('Failed to save trip', error);
        this.isSaving = false;
        alert('Failed to save trip');
        this.cdr.detectChanges();
      },
    });
  }

  editTrip(trip: any): void {
    this.isEditing = true;

    this.form = {
      id: trip.id,
      routeId: trip.routeId,
      vehicleId: trip.vehicleId,
      driverId: trip.driverId ?? null,
      departureDate: trip.departureDate,
      departureTime: this.formatTimeForInput(trip.departureTime),
      price: trip.price,
    };

    this.cdr.detectChanges();
  }

  activateTrip(id: number): void {
    this.tripService.activateTrip(id).subscribe({
      next: () => this.loadTrips(),
      error: (error: any) => {
        console.error('Failed to activate trip', error);
        alert('Failed to activate trip');
        this.cdr.detectChanges();
      },
    });
  }

  deactivateTrip(id: number): void {
    this.tripService.deactivateTrip(id).subscribe({
      next: () => this.loadTrips(),
      error: (error: any) => {
        console.error('Failed to deactivate trip', error);
        alert('Failed to deactivate trip');
        this.cdr.detectChanges();
      },
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.isSaving = false;

    this.form = {
      id: null,
      routeId: null,
      vehicleId: null,
      driverId: null,
      departureDate: '',
      departureTime: '',
      price: null,
    };

    this.cdr.detectChanges();
  }

  getRouteName(routeId: number): string {
    const route = this.routes.find((item: any) => item.id === routeId);
    return route ? `${route.fromCity} → ${route.toCity}` : `Route #${routeId}`;
  }

  getVehicleName(vehicleId: number): string {
    const vehicle = this.vehicles.find((item: any) => item.id === vehicleId);

    return vehicle
      ? `${vehicle.vehicleType} • ${vehicle.plateNumber}`
      : `Vehicle #${vehicleId}`;
  }

  getDriverName(driverId: number): string {
    const driver = this.drivers.find((item: any) => item.id === driverId);
    return driver ? driver.fullName : 'No Driver';
  }

  getVehicleSeats(vehicleId: number): number {
    const vehicle = this.vehicles.find((item: any) => item.id === vehicleId);
    return vehicle ? Number(vehicle.seatCount || 0) : 0;
  }

  formatTime(value: string): string {
    if (!value) return '-';
    return value.length >= 5 ? value.substring(0, 5) : value;
  }

  formatTimeForInput(value: string): string {
    if (!value) return '';
    return value.length >= 5 ? value.substring(0, 5) : value;
  }
}