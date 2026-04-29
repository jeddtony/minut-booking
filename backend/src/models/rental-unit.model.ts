import mongoose, { Document, Schema } from 'mongoose';

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  VILLA = 'villa',
  STUDIO = 'studio',
  CONDO = 'condo',
  OTHER = 'other',
}

export interface IRentalUnit extends Document {
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  pricePerNight: number;
  propertyType: PropertyType;
  description?: string;
  imageKey?: string;
}

const rentalUnitSchema = new Schema<IRentalUnit>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    pricePerNight: { type: Number, required: true, min: 0 },
    propertyType: { type: String, required: true, enum: Object.values(PropertyType) },
    description: { type: String, trim: true },
    imageKey: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const RentalUnitModel = mongoose.model<IRentalUnit>('RentalUnit', rentalUnitSchema);
