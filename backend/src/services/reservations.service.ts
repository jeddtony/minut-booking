import mongoose, { FilterQuery } from 'mongoose';
import { IReservation, ReservationModel, ReservationStatus } from '@models/reservation.model';
import { RentalUnitModel } from '@models/rental-unit.model';
import { CreateReservationDto, UpdateReservationDto } from '@dtos/reservation.dto';
import { HttpException } from '@exceptions/HttpException';
import { PaginatedResult } from '@interfaces/pagination.interface';

type ReservationUpdatePayload = {
  rentalUnitId?: string;
  guestName?: string;
  startDate?: Date;
  endDate?: Date;
  status?: ReservationStatus;
};

export class ReservationsService {
  public async findAll(
    rentalUnitId?: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<IReservation>> {
    const query: FilterQuery<IReservation> = {};

    if (rentalUnitId) {
      if (!mongoose.Types.ObjectId.isValid(rentalUnitId)) throw new HttpException(400, 'Invalid rentalUnitId');
      query.rentalUnitId = rentalUnitId;
    }

    // Overlap condition: reservation overlaps [startDate, endDate] when
    //   reservation.startDate < queryEndDate  AND  reservation.endDate > queryStartDate
    if (startDate && endDate) {
      query.$and = [{ startDate: { $lt: new Date(endDate) } }, { endDate: { $gt: new Date(startDate) } }];
    } else if (startDate) {
      query.endDate = { $gt: new Date(startDate) };
    } else if (endDate) {
      query.startDate = { $lt: new Date(endDate) };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      ReservationModel.find(query).populate('rentalUnitId').skip(skip).limit(limit),
      ReservationModel.countDocuments(query),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  public async findById(id: string): Promise<IReservation> {
    const reservation = await ReservationModel.findById(id).populate('rentalUnitId');
    if (!reservation) throw new HttpException(404, `Reservation with id ${id} not found`);
    return reservation;
  }

  public async create(dto: CreateReservationDto): Promise<IReservation> {
    const unit = await RentalUnitModel.findById(dto.rentalUnitId);
    if (!unit) throw new HttpException(404, `Rental unit with id ${dto.rentalUnitId} not found`);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (startDate >= endDate) throw new HttpException(400, 'startDate must be before endDate');

    await this.checkAvailability(dto.rentalUnitId, startDate, endDate);

    return ReservationModel.create({ ...dto, startDate, endDate });
  }

  public async update(id: string, dto: UpdateReservationDto): Promise<IReservation> {
    // Fetch current reservation and validate the new unit (if changed) in parallel
    const [current, newUnit] = await Promise.all([
      ReservationModel.findById(id),
      dto.rentalUnitId ? RentalUnitModel.findById(dto.rentalUnitId) : Promise.resolve(null),
    ]);

    if (!current) throw new HttpException(404, `Reservation with id ${id} not found`);
    if (dto.rentalUnitId && !newUnit) throw new HttpException(404, `Rental unit with id ${dto.rentalUnitId} not found`);

    const payload: ReservationUpdatePayload = {};
    if (dto.rentalUnitId !== undefined) payload.rentalUnitId = dto.rentalUnitId;
    if (dto.guestName !== undefined) payload.guestName = dto.guestName;
    if (dto.startDate !== undefined) payload.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) payload.endDate = new Date(dto.endDate);
    if (dto.status !== undefined) payload.status = dto.status;

    // Merge with current values so the full effective range is always validated
    const effectiveUnitId = payload.rentalUnitId ?? current.rentalUnitId.toString();
    const effectiveStart = payload.startDate ?? current.startDate;
    const effectiveEnd = payload.endDate ?? current.endDate;

    if (effectiveStart >= effectiveEnd) throw new HttpException(400, 'startDate must be before endDate');

    await this.checkAvailability(effectiveUnitId, effectiveStart, effectiveEnd, id);

    const reservation = await ReservationModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!reservation) throw new HttpException(404, `Reservation with id ${id} not found`);
    return reservation;
  }

  public async delete(id: string): Promise<IReservation> {
    const reservation = await ReservationModel.findByIdAndDelete(id);
    if (!reservation) throw new HttpException(404, `Reservation with id ${id} not found`);
    return reservation;
  }

  // Throws 409 if a non-cancelled reservation already occupies the date range for the unit.
  // Pass excludeId when updating so the reservation being edited doesn't conflict with itself.
  private async checkAvailability(
    rentalUnitId: string,
    startDate: Date,
    endDate: Date,
    excludeId?: string,
  ): Promise<void> {
    const query: FilterQuery<IReservation> = {
      rentalUnitId,
      status: { $ne: ReservationStatus.CANCELLED },
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    };
    if (excludeId) query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };

    const conflict = await ReservationModel.exists(query);
    if (conflict) {
      throw new HttpException(
        409,
        `Rental unit is not available from ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`,
      );
    }
  }
}
