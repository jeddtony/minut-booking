import mongoose, { Document, Schema } from 'mongoose';

export type ReservationStatus = 'confirmed' | 'pending' | 'cancelled';

export interface IReservation extends Document {
  rentalUnitId: mongoose.Types.ObjectId;
  guestName: string;
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
}

const reservationSchema = new Schema<IReservation>(
  {
    rentalUnitId: { type: Schema.Types.ObjectId, ref: 'RentalUnit', required: true },
    guestName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ReservationModel = mongoose.model<IReservation>('Reservation', reservationSchema);
