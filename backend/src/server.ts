import 'reflect-metadata';
import { App } from './app';
import { AuthRoute } from '@routes/auth.route';
import { RentalUnitsRoute } from '@routes/rental-units.route';
import { ReservationsRoute } from '@routes/reservations.route';
import { validateEnv } from '@utils/validateEnv';

validateEnv();

const app = new App([new AuthRoute(), new RentalUnitsRoute(), new ReservationsRoute()]);

app.listen();
