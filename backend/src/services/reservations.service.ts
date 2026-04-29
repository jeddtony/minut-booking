import mongoose, { FilterQuery } from 'mongoose';
import { IReservation, ReservationModel } from '@models/reservation.model';
import { RentalUnitModel } from '@models/rental-unit.model';
import { CreateReservationDto, UpdateReservationDto } from '@dtos/reservation.dto';
import { HttpException } from '@exceptions/HttpException';

type ReservationUpdatePayload = {
  rentalUnitId?: string;
  guestName?: string;
  startDate?: Date;
  endDate?: Date;
};

export class ReservationsService {
  public async findAll(rentalUnitId?: string, startDate?: string, endDate?: string): Promise<IReservation[]> {
    const query: FilterQuery<IReservation> = {};

    if (rentalUnitId) {
      if (!mongoose.Types.ObjectId.isValid(rentalUnitId)) throw new HttpException(400, 'Invalid rentalUnitId');
      query.rentalUnitId = rentalUnitId;
    }

    if (startDate || endDate) {
      const dateConditions: FilterQuery<IReservation>[] = [];
      if (startDate) dateConditions.push({ startDate: { $gte: new Date(startDate) } });
      if (endDate) dateConditions.push({ endDate: { $lte: new Date(endDate) } });
      query.$and = dateConditions;
    }

    return ReservationModel.find(query).populate('rentalUnitId');
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

    return ReservationModel.create({ ...dto, startDate, endDate });
  }

  public async update(id: string, dto: UpdateReservationDto): Promise<IReservation> {
    if (dto.rentalUnitId) {
      const unit = await RentalUnitModel.findById(dto.rentalUnitId);
      if (!unit) throw new HttpException(404, `Rental unit with id ${dto.rentalUnitId} not found`);
    }

    const payload: ReservationUpdatePayload = {};
    if (dto.rentalUnitId !== undefined) payload.rentalUnitId = dto.rentalUnitId;
    if (dto.guestName !== undefined) payload.guestName = dto.guestName;
    if (dto.startDate !== undefined) payload.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) payload.endDate = new Date(dto.endDate);

    if (payload.startDate && payload.endDate && payload.startDate >= payload.endDate) {
      throw new HttpException(400, 'startDate must be before endDate');
    }

    const reservation = await ReservationModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!reservation) throw new HttpException(404, `Reservation with id ${id} not found`);
    return reservation;
  }

  public async delete(id: string): Promise<IReservation> {
    const reservation = await ReservationModel.findByIdAndDelete(id);
    if (!reservation) throw new HttpException(404, `Reservation with id ${id} not found`);
    return reservation;
  }
}
