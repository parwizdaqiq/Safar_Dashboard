import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Trip } from '../../services/trip';
import { Route } from '../../services/route';
import { Vehicle } from '../../services/vehicle';

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

  form = {
    id: null as number | null,
    routeId: null as number | null,
    vehicleId: null as number | null,
    departureDate: '',
    departureTime: '',
    price: null as number | null,
  };

  isEditing = false;
  isLoading = false;
  isSaving = false;

  get totalTrips(): number {
    return this.trips.length;
  }

  get activeTrips(): number {
    return this.trips.filter((trip) => trip.active === true).length;
  }

  get todayTrips(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.trips.filter((trip) => trip.departureDate === today).length;
  }

  get averagePrice(): number {
    if (this.trips.length === 0) return 0;

    const total = this.trips.reduce(
      (sum, trip) => sum + Number(trip.price || 0),
      0
    );

    return Math.round(total / this.trips.length);
  }

  constructor(
    private tripService: Trip,
    private routeService: Route,
    private vehicleService: Vehicle,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoutes();
    this.loadVehicles();
    this.loadTrips();
  }

  loadTrips(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.tripService.getAllTrips().subscribe({
      next: (data) => {
        this.trips = [...data].reverse();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load trips', error);
        this.isLoading = false;
        alert('Failed to load trips');
        this.cdr.detectChanges();
      },
    });
  }

  loadRoutes(): void {
    this.routeService.getAllRoutes().subscribe({
      next: (data) => {
        this.routes = data.filter((route) => route.active === true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load routes', error);
        this.cdr.detectChanges();
      },
    });
  }

  loadVehicles(): void {
    this.vehicleService.getAllVehicles().subscribe({
      next: (data) => {
        this.vehicles = data.filter((vehicle) => vehicle.active === true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load vehicles', error);
        this.cdr.detectChanges();
      },
    });
  }

  saveTrip(): void {
    if (
      !this.form.routeId ||
      !this.form.vehicleId ||
      !this.form.departureDate ||
      !this.form.departureTime ||
      !this.form.price
    ) {
      alert('Please fill all fields');
      return;
    }

    const payload = {
      routeId: Number(this.form.routeId),
      vehicleId: Number(this.form.vehicleId),
      departureDate: this.form.departureDate,
      departureTime: this.form.departureTime,
      price: Number(this.form.price),
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.form.id !== null) {
      this.tripService.updateTrip(this.form.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.resetForm();
          this.loadTrips();
        },
        error: (error) => {
          console.error('Failed to update trip', error);
          this.isSaving = false;
          alert('Failed to update trip');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.tripService.createTrip(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.resetForm();
          this.loadTrips();
        },
        error: (error) => {
          console.error('Failed to create trip', error);
          this.isSaving = false;
          alert('Failed to create trip');
          this.cdr.detectChanges();
        },
      });
    }
  }

  editTrip(trip: any): void {
    this.isEditing = true;

    this.form = {
      id: trip.id,
      routeId: trip.routeId,
      vehicleId: trip.vehicleId,
      departureDate: trip.departureDate,
      departureTime: this.formatTimeForInput(trip.departureTime),
      price: trip.price,
    };

    this.cdr.detectChanges();
  }

  activateTrip(id: number): void {
    this.tripService.activateTrip(id).subscribe({
      next: () => this.loadTrips(),
      error: (error) => {
        console.error('Failed to activate trip', error);
        alert('Failed to activate trip');
        this.cdr.detectChanges();
      },
    });
  }

  deactivateTrip(id: number): void {
    this.tripService.deactivateTrip(id).subscribe({
      next: () => this.loadTrips(),
      error: (error) => {
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
      departureDate: '',
      departureTime: '',
      price: null,
    };

    this.cdr.detectChanges();
  }

  getRouteName(routeId: number): string {
    const route = this.routes.find((item) => item.id === routeId);
    return route ? `${route.fromCity} → ${route.toCity}` : `Route #${routeId}`;
  }

  getVehicleName(vehicleId: number): string {
    const vehicle = this.vehicles.find((item) => item.id === vehicleId);

    return vehicle
      ? `${vehicle.companyName} • ${vehicle.plateNumber}`
      : `Vehicle #${vehicleId}`;
  }

  getVehicleSeats(vehicleId: number): number {
    const vehicle = this.vehicles.find((item) => item.id === vehicleId);
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