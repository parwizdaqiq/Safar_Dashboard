import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  filteredRoutes: any[] = [];
  selectedRoute: any = null;

  searchText = '';
  showRouteModal = false;

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

  get totalRoutes(): number {
    return this.routes.length;
  }

  get activeRoutes(): number {
    return this.routes.filter((route: any) => route.active === true).length;
  }

  get inactiveRoutes(): number {
    return this.routes.filter((route: any) => route.active !== true).length;
  }

  get longestRoute(): string {
    if (this.routes.length === 0) return '0';

    const distances = this.routes
      .map((route: any) => Number(String(route.distance || '').replace(/\D/g, '')))
      .filter((value: number) => !isNaN(value));

    if (distances.length === 0) return '0';

    return `${Math.max(...distances)} km`;
  }

  loadRoutes(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.routeService.getAllRoutes().subscribe({
      next: (data: any[]) => {
        this.routes = [...data].reverse();
        this.applyFilters();
        this.selectedRoute = this.filteredRoutes[0] || null;

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Failed to load routes', error);
        this.isLoading = false;
        alert('Failed to load routes. Check backend or CORS.');
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    const search = this.searchText.trim().toLowerCase();

    this.filteredRoutes = this.routes.filter((route: any) => {
      return (
        !search ||
        String(route.id || '').toLowerCase().includes(search) ||
        String(route.fromCity || '').toLowerCase().includes(search) ||
        String(route.toCity || '').toLowerCase().includes(search) ||
        String(route.distance || '').toLowerCase().includes(search) ||
        String(route.estimatedDuration || '').toLowerCase().includes(search)
      );
    });

    if (
      this.selectedRoute &&
      !this.filteredRoutes.some((route: any) => route.id === this.selectedRoute.id)
    ) {
      this.selectedRoute = this.filteredRoutes[0] || null;
    }

    this.cdr.detectChanges();
  }

  selectRoute(route: any): void {
    this.selectedRoute = route;
  }

  openRouteModal(): void {
    this.resetForm();
    this.showRouteModal = true;
  }

  closeRouteModal(): void {
    this.showRouteModal = false;
    this.resetForm();
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

    const request =
      this.isEditing && this.form.id !== null
        ? this.routeService.updateRoute(this.form.id, payload)
        : this.routeService.createRoute(payload);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeRouteModal();
        this.loadRoutes();
      },
      error: (error: any) => {
        console.error('Save route failed', error);
        this.isSaving = false;
        alert('Failed to save route');
        this.cdr.detectChanges();
      },
    });
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

    this.selectedRoute = route;
    this.showRouteModal = true;
    this.cdr.detectChanges();
  }

  activateRoute(id: number): void {
    this.routeService.activateRoute(id).subscribe({
      next: () => this.loadRoutes(),
      error: (error: any) => {
        console.error('Activate route failed', error);
        alert('Failed to activate route');
        this.cdr.detectChanges();
      },
    });
  }

  deactivateRoute(id: number): void {
    this.routeService.deactivateRoute(id).subscribe({
      next: () => this.loadRoutes(),
      error: (error: any) => {
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