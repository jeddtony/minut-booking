import mongoose from 'mongoose';
import { RentalUnitModel } from '@models/rental-unit.model';
import { ReservationModel } from '@models/reservation.model';
import { WeeklyAvailabilityResult, PropertyEntry, GridEntry, DayCell } from '@interfaces/dashboard.interface';
import { HttpException } from '@exceptions/HttpException';

export class DashboardService {
  public async getWeeklyAvailability(
    startDateStr: string,
    endDateStr: string | undefined,
    propertyId?: string,
  ): Promise<WeeklyAvailabilityResult> {
    if (propertyId && !mongoose.Types.ObjectId.isValid(propertyId)) {
      throw new HttpException(400, 'Invalid property_id');
    }

    const startDate = new Date(startDateStr + 'T00:00:00.000Z');
    const endDate = endDateStr
      ? new Date(endDateStr + 'T00:00:00.000Z')
      : new Date(startDate.getTime() + 7 * 86_400_000);

    if (startDate >= endDate) throw new HttpException(400, 'start_date must be before end_date');

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrowUTC = new Date(todayUTC.getTime() + 86_400_000);

    // --- 1. Fetch all relevant rental units (single query) ---
    const unitFilter = propertyId ? { _id: new mongoose.Types.ObjectId(propertyId) } : {};
    const units = await RentalUnitModel.find(unitFilter).lean();
    const unitIds = units.map(u => u._id);

    // --- 2. Parallel queries — no N+1 ---
    const [activeCount, checkinsCount, checkoutsCount, rangeReservations] = await Promise.all([
      // Active: confirmed reservations that haven't fully ended yet (overlap today or future)
      ReservationModel.countDocuments({
        rentalUnitId: { $in: unitIds },
        status: 'confirmed',
        endDate: { $gt: todayUTC },
      }),

      // Check-ins: reservations starting today
      ReservationModel.countDocuments({
        rentalUnitId: { $in: unitIds },
        status: 'confirmed',
        startDate: { $gte: todayUTC, $lt: tomorrowUTC },
      }),

      // Check-outs: reservations ending today
      ReservationModel.countDocuments({
        rentalUnitId: { $in: unitIds },
        status: 'confirmed',
        endDate: { $gte: todayUTC, $lt: tomorrowUTC },
      }),

      // Reservations overlapping the requested date range (for grid + occupancy)
      ReservationModel.find({
        rentalUnitId: { $in: unitIds },
        status: 'confirmed',
        startDate: { $lt: endDate },
        endDate: { $gt: startDate },
      }).lean(),
    ]);

    // --- 3. Occupancy rate ---
    const daysInRange = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
    const totalAvailableUnitDays = units.length * daysInRange;

    let totalBookedUnitDays = 0;
    for (const res of rangeReservations) {
      const overlapStart = res.startDate > startDate ? res.startDate : startDate;
      const overlapEnd = res.endDate < endDate ? res.endDate : endDate;
      const overlapDays = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86_400_000);
      totalBookedUnitDays += Math.max(0, overlapDays);
    }

    const occupancyRate =
      totalAvailableUnitDays > 0
        ? Math.round((totalBookedUnitDays / totalAvailableUnitDays) * 100) / 100
        : 0;

    // --- 4. Group reservations by unit for O(1) lookups ---
    const reservationsByUnit = new Map<string, typeof rangeReservations>();
    for (const res of rangeReservations) {
      const key = res.rentalUnitId.toString();
      if (!reservationsByUnit.has(key)) reservationsByUnit.set(key, []);
      reservationsByUnit.get(key)!.push(res);
    }

    // --- 5. Build ordered day sequence ---
    const days: Date[] = [];
    for (let d = new Date(startDate); d < endDate; d = new Date(d.getTime() + 86_400_000)) {
      days.push(new Date(d));
    }

    // --- 6. Build properties list + availability grid ---
    const properties: PropertyEntry[] = units.map(unit => {
      const unitReservations = reservationsByUnit.get(unit._id.toString()) ?? [];
      return {
        id: unit._id.toString(),
        name: unit.name,
        bookings: unitReservations.map(r => ({
          id: r._id.toString(),
          guest_name: r.guestName,
          start_date: r.startDate.toISOString().slice(0, 10),
          end_date: r.endDate.toISOString().slice(0, 10),
        })),
      };
    });

    const grid: GridEntry[] = units.map(unit => {
      const unitReservations = reservationsByUnit.get(unit._id.toString()) ?? [];
      const gridDays: DayCell[] = days.map(day => {
        // A day is occupied when check-in <= day < check-out (checkout day is free)
        const match = unitReservations.find(r => r.startDate <= day && day < r.endDate) ?? null;
        return {
          date: day.toISOString().slice(0, 10),
          reservation: match ? { id: match._id.toString(), guest_name: match.guestName } : null,
        };
      });
      return { property_id: unit._id.toString(), days: gridDays };
    });

    return {
      summary: {
        total_units: units.length,
        active_reservations: activeCount,
        occupancy_rate: occupancyRate,
        checkins_today: checkinsCount,
        checkouts_today: checkoutsCount,
      },
      week_range: {
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
      },
      properties,
      grid,
    };
  }
}
