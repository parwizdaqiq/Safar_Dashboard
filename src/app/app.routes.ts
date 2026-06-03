import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { Trips } from './pages/trips/trips';
import { Routes as RoutesPage } from './pages/routes/routes';
import { Vehicles } from './pages/vehicles/vehicles';
import { Bookings } from './pages/bookings/bookings';
import { Agencies } from './pages/agencies/agencies';
import { Users } from './pages/users/users';
import { Login } from './pages/login/login';
import { adminAuthGuard } from './guards/admin-auth-guard';

export const routes: Routes = [
  { path: 'login', component: Login },

  { path: '', component: Dashboard, canActivate: [adminAuthGuard] },
  { path: 'trips', component: Trips, canActivate: [adminAuthGuard] },
  { path: 'routes', component: RoutesPage, canActivate: [adminAuthGuard] },
  { path: 'vehicles', component: Vehicles, canActivate: [adminAuthGuard] },
  { path: 'bookings', component: Bookings, canActivate: [adminAuthGuard] },
  { path: 'agencies', component: Agencies, canActivate: [adminAuthGuard] },
  { path: 'users', component: Users, canActivate: [adminAuthGuard] },

  { path: '**', redirectTo: '' },
];