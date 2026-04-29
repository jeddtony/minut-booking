import mongoose, { Document, Schema } from 'mongoose';

export interface IRentalUnit extends Document {
  name: string;
  address?: string;
}

const rentalUnitSchema = new Schema<IRentalUnit>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const RentalUnitModel = mongoose.model<IRentalUnit>('RentalUnit', rentalUnitSchema);
