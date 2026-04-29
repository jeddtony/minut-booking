import 'reflect-metadata';
import { App } from './app';
import { RentalUnitsRoute } from '@routes/rental-units.route';
import { ReservationsRoute } from '@routes/reservations.route';
import { validateEnv } from '@utils/validateEnv';

validateEnv();

const app = new App([new RentalUnitsRoute(), new ReservationsRoute()]);

app.listen();
