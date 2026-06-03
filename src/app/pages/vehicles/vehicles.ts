import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Vehicle } from '../../services/vehicle';

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

  get totalVehicles(): number {
    return this.vehicles.length;
  }

  get activeVehicles(): number {
    return this.vehicles.filter((vehicle) => vehicle.active === true).length;
  }

  get totalBuses(): number {
    return this.vehicles.filter((vehicle) => vehicle.vehicleType === 'BUS').length;
  }

  get totalSeats(): number {
    return this.vehicles.reduce(
      (sum, vehicle) => sum + Number(vehicle.seatCount || 0),
      0
    );
  }

  constructor(private vehicleService: Vehicle) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.isLoading = true;

    this.vehicleService.getAllVehicles().subscribe({
      next: (data) => {
        this.vehicles = [...data].reverse();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load vehicles', error);
        this.isLoading = false;
        alert('Failed to load vehicles');
      },
    });
  }

  saveVehicle(): void {
    if (
      !this.form.vehicleType ||
      !this.form.companyName.trim() ||
      !this.form.plateNumber.trim() ||
      !this.form.seatCount
    ) {
      alert('Please fill all fields');
      return;
    }

    const payload = {
      vehicleType: this.form.vehicleType,
      companyName: this.form.companyName.trim(),
      plateNumber: this.form.plateNumber.trim(),
      seatCount: Number(this.form.seatCount),
    };

    this.isSaving = true;

    if (this.isEditing && this.form.id !== null) {
      this.vehicleService.updateVehicle(this.form.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.resetForm();
          this.loadVehicles();
        },
        error: (error) => {
          console.error('Failed to update vehicle', error);
          this.isSaving = false;
          alert('Failed to update vehicle');
        },
      });
    } else {
      this.vehicleService.createVehicle(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.resetForm();
          this.loadVehicles();
        },
        error: (error) => {
          console.error('Failed to create vehicle', error);
          this.isSaving = false;
          alert('Failed to create vehicle');
        },
      });
    }
  }

  editVehicle(vehicle: any): void {
    this.isEditing = true;

    this.form = {
      id: vehicle.id,
      vehicleType: vehicle.vehicleType ?? 'BUS',
      companyName: vehicle.companyName ?? '',
      plateNumber: vehicle.plateNumber ?? '',
      seatCount: vehicle.seatCount ?? null,
    };
  }

  activateVehicle(id: number): void {
    this.vehicleService.activateVehicle(id).subscribe({
      next: () => this.loadVehicles(),
      error: (error) => {
        console.error('Failed to activate vehicle', error);
        alert('Failed to activate vehicle');
      },
    });
  }

  deactivateVehicle(id: number): void {
    this.vehicleService.deactivateVehicle(id).subscribe({
      next: () => this.loadVehicles(),
      error: (error) => {
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
      companyName: '',
      plateNumber: '',
      seatCount: null,
    };
  }
}