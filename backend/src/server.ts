import 'reflect-metadata';
import { App } from './app';
import { AuthRoute } from '@routes/auth.route';
import { RentalUnitsRoute } from '@routes/rental-units.route';
import { ReservationsRoute } from '@routes/reservations.route';
import { DashboardRoute } from '@routes/dashboard.route';
import { validateEnv } from '@utils/validateEnv';

validateEnv();

const app = new App([new AuthRoute(), new RentalUnitsRoute(), new ReservationsRoute(), new DashboardRoute()]);

app.listen();
