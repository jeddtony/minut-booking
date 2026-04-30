import mongoose from 'mongoose';
import { RentalUnitModel } from '@models/rental-unit.model';
import { ReservationModel, IReservation } from '@models/reservation.model';
import {
  WeeklyAvailabilityResult,
  MonthlyAvailabilityResult,
  PropertyEntry,
  GridEntry,
  DayCell,
} from '@interfaces/dashboard.interface';
import { HttpException } from '@exceptions/HttpException';

type LeanReservation = Omit<IReservation, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
  rentalUnitId: mongoose.Types.ObjectId;
};

interface CoreResult {
  totalUnits: number;
  activeCount: number;
  checkinsToday: number;
  checkoutsToday: number;
  rangeReservations: LeanReservation[];
  occupancyRate: number;
  properties: PropertyEntry[];
  grid: GridEntry[];
}

export class DashboardService {
  // -----------------------------------------------------------------------
  // Public: weekly
  // -----------------------------------------------------------------------

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

    const core = await this.computeAvailability(startDate, endDate, propertyId);

    return {
      summary: {
        total_units: core.totalUnits,
        active_reservations: core.activeCount,
        occupancy_rate: core.occupancyRate,
        checkins_today: core.checkinsToday,
        checkouts_today: core.checkoutsToday,
      },
      week_range: {
        start_date: startDate.toISOString().slice(0, 10),
        end_date: endDate.toISOString().slice(0, 10),
      },
      properties: core.properties,
      grid: core.grid,
    };
  }

  // -----------------------------------------------------------------------
  // Public: monthly
  // -----------------------------------------------------------------------

  public async getMonthlyAvailability(monthStr: string, propertyId?: string): Promise<MonthlyAvailabilityResult> {
    if (propertyId && !mongoose.Types.ObjectId.isValid(propertyId)) {
      throw new HttpException(400, 'Invalid property_id');
    }

    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthStr);
    if (!match) throw new HttpException(400, 'month must be in YYYY-MM format (e.g. 2024-10)');

    const year = parseInt(match[1]);
    const month = parseInt(match[2]);

    // endDateExclusive = first day of the following month
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDateExclusive = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(endDateExclusive.getTime() - 86_400_000);
    const totalDays = Math.round((endDateExclusive.getTime() - startDate.getTime()) / 86_400_000);

    const core = await this.computeAvailability(startDate, endDateExclusive, propertyId);

    // Period-specific counts derived in-memory from the already-fetched reservations
    const checkinsThisMonth = core.rangeReservations.filter(
      r => r.startDate >= startDate && r.startDate < endDateExclusive,
    ).length;

    const checkoutsThisMonth = core.rangeReservations.filter(
      r => r.endDate >= startDate && r.endDate < endDateExclusive,
    ).length;

    return {
      summary: {
        total_units: core.totalUnits,
        active_reservations: core.activeCount,
        occupancy_rate: core.occupancyRate,
        checkins_today: core.checkinsToday,
        checkouts_today: core.checkoutsToday,
        checkins_this_month: checkinsThisMonth,
        checkouts_this_month: checkoutsThisMonth,
      },
      month_range: {
        year,
        month,
        start_date: startDate.toISOString().slice(0, 10),
        end_date: lastDayOfMonth.toISOString().slice(0, 10),
        total_days: totalDays,
      },
      properties: core.properties,
      grid: core.grid,
    };
  }

  // -----------------------------------------------------------------------
  // Private: shared DB queries + computation
  // -----------------------------------------------------------------------

  private async computeAvailability(startDate: Date, endDate: Date, propertyId?: string): Promise<CoreResult> {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrowUTC = new Date(todayUTC.getTime() + 86_400_000);

    // 1. Fetch all relevant rental units (single query)
    const unitFilter = propertyId ? { _id: new mongoose.Types.ObjectId(propertyId) } : {};
    const units = await RentalUnitModel.find(unitFilter).lean();
    const unitIds = units.map(u => u._id);

    // 2. Four parallel queries — no N+1
    const [activeCount, checkinsToday, checkoutsToday, rangeReservations] = await Promise.all([
      // Confirmed reservations that haven't fully ended (active today or in the future)
      ReservationModel.countDocuments({
        rentalUnitId: { $in: unitIds },
        status: 'confirmed',
        endDate: { $gt: todayUTC },
      }),

      // Check-ins today
      ReservationModel.countDocuments({
        rentalUnitId: { $in: unitIds },
        status: 'confirmed',
        startDate: { $gte: todayUTC, $lt: tomorrowUTC },
      }),

      // Check-outs today
      ReservationModel.countDocuments({
        rentalUnitId: { $in: unitIds },
        status: 'confirmed',
        endDate: { $gte: todayUTC, $lt: tomorrowUTC },
      }),

      // All confirmed reservations overlapping the requested range
      ReservationModel.find({
        rentalUnitId: { $in: unitIds },
        status: 'confirmed',
        startDate: { $lt: endDate },
        endDate: { $gt: startDate },
      }).lean() as Promise<LeanReservation[]>,
    ]);

    // 3. Occupancy rate — clamp each reservation to the query window
    const daysInRange = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
    const totalAvailableUnitDays = units.length * daysInRange;
    let totalBookedUnitDays = 0;
    for (const res of rangeReservations) {
      const overlapStart = res.startDate > startDate ? res.startDate : startDate;
      const overlapEnd = res.endDate < endDate ? res.endDate : endDate;
      totalBookedUnitDays += Math.max(0, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86_400_000));
    }
    const occupancyRate =
      totalAvailableUnitDays > 0 ? Math.round((totalBookedUnitDays / totalAvailableUnitDays) * 100) / 100 : 0;

    // 4. Group reservations by unit for O(1) per-day lookup
    const reservationsByUnit = new Map<string, LeanReservation[]>();
    for (const res of rangeReservations) {
      const key = res.rentalUnitId.toString();
      if (!reservationsByUnit.has(key)) reservationsByUnit.set(key, []);
      reservationsByUnit.get(key)!.push(res);
    }

    // 5. Ordered day sequence
    const days: Date[] = [];
    for (let d = new Date(startDate); d < endDate; d = new Date(d.getTime() + 86_400_000)) {
      days.push(new Date(d));
    }

    // 6. Properties list + grid
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
        // Occupied when check-in <= day < check-out (checkout day is free)
        const match = unitReservations.find(r => r.startDate <= day && day < r.endDate) ?? null;
        return {
          date: day.toISOString().slice(0, 10),
          reservation: match ? { id: match._id.toString(), guest_name: match.guestName } : null,
        };
      });
      return { property_id: unit._id.toString(), days: gridDays };
    });

    return { totalUnits: units.length, activeCount, checkinsToday, checkoutsToday, rangeReservations, occupancyRate, properties, grid };
  }
}
