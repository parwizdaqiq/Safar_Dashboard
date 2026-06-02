import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { Trips } from './pages/trips/trips';
import { Routes as RoutesPage } from './pages/routes/routes';
import { Vehicles } from './pages/vehicles/vehicles';
import { Bookings } from './pages/bookings/bookings';
import { Agencies } from './pages/agencies/agencies';
import { Users } from './pages/users/users';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'trips', component: Trips },
  { path: 'routes', component: RoutesPage },
  { path: 'vehicles', component: Vehicles },
  { path: 'bookings', component: Bookings },
  { path: 'agencies', component: Agencies },
  { path: 'users', component: Users },
  { path: '**', redirectTo: '' },
];