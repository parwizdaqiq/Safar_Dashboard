import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Vehicle } from '../../services/vehicle';
import { AdminAuth } from '../../services/admin-auth';

@Component({
  selector: 'app-vehicles',
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.scss',
})
export class Vehicles implements OnInit {
  vehicles: any[] = [];

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

    const request =
      this.isAgency && this.currentUserId
        ? this.vehicleService.getAgencyVehicles(this.currentUserId)
        : this.vehicleService.getAllVehicles();

    request.subscribe({
      next: (data: any[]) => {
        this.vehicles = [...data].reverse();
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
        this.resetForm();
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