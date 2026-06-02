import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Route } from '../../services/route';

@Component({
  selector: 'app-routes',
  imports: [CommonModule, FormsModule],
  templateUrl: './routes.html',
  styleUrl: './routes.scss',
})
export class Routes implements OnInit {
  routes: any[] = [];

  form = {
    id: null as number | null,
    fromCity: '',
    toCity: '',
    distance: '',
    estimatedDuration: '',
  };

  isEditing = false;
  isLoading = false;
  isSaving = false;

  constructor(
    private routeService: Route,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.isLoading = true;

    this.routeService.getAllRoutes().subscribe({
      next: (data) => {
        this.routes = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load routes', error);
        this.isLoading = false;
        alert('Failed to load routes. Check backend or CORS.');
        this.cdr.detectChanges();
      },
    });
  }

  saveRoute(): void {
    if (
      !this.form.fromCity.trim() ||
      !this.form.toCity.trim() ||
      !this.form.distance.trim() ||
      !this.form.estimatedDuration.trim()
    ) {
      alert('Please fill all fields');
      return;
    }

    const payload = {
      fromCity: this.form.fromCity.trim(),
      toCity: this.form.toCity.trim(),
      distance: this.form.distance.trim(),
      estimatedDuration: this.form.estimatedDuration.trim(),
    };

    this.isSaving = true;
    this.cdr.detectChanges();

    if (this.isEditing && this.form.id !== null) {
      this.routeService.updateRoute(this.form.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.resetForm();
          this.loadRoutes();
          alert('Route updated successfully');
        },
        error: (error) => {
          console.error('Update route failed', error);
          this.isSaving = false;
          alert('Failed to update route');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.routeService.createRoute(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.resetForm();
          this.loadRoutes();
          alert('Route created successfully');
        },
        error: (error) => {
          console.error('Create route failed', error);
          this.isSaving = false;
          alert('Failed to create route. Check backend or CORS.');
          this.cdr.detectChanges();
        },
      });
    }
  }

  editRoute(route: any): void {
    this.isEditing = true;

    this.form = {
      id: route.id,
      fromCity: route.fromCity ?? '',
      toCity: route.toCity ?? '',
      distance: route.distance ?? '',
      estimatedDuration: route.estimatedDuration ?? '',
    };

    this.cdr.detectChanges();
  }

  activateRoute(id: number): void {
    this.routeService.activateRoute(id).subscribe({
      next: () => {
        this.loadRoutes();
      },
      error: (error) => {
        console.error('Activate route failed', error);
        alert('Failed to activate route');
        this.cdr.detectChanges();
      },
    });
  }

  deactivateRoute(id: number): void {
    this.routeService.deactivateRoute(id).subscribe({
      next: () => {
        this.loadRoutes();
      },
      error: (error) => {
        console.error('Deactivate route failed', error);
        alert('Failed to deactivate route');
        this.cdr.detectChanges();
      },
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.isSaving = false;

    this.form = {
      id: null,
      fromCity: '',
      toCity: '',
      distance: '',
      estimatedDuration: '',
    };

    this.cdr.detectChanges();
  }
}