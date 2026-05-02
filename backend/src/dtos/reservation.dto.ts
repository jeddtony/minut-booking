import { IsString, IsOptional, IsNotEmpty, IsDateString, IsMongoId, IsEnum } from 'class-validator';
import { ReservationStatus } from '@models/reservation.model';

export class CreateReservationDto {
  @IsMongoId()
  @IsNotEmpty()
  public rentalUnitId!: string;

  @IsString()
  @IsNotEmpty()
  public guestName!: string;

  @IsDateString()
  @IsNotEmpty()
  public startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  public endDate!: string;
}

export class UpdateReservationDto {
  @IsMongoId()
  @IsOptional()
  public rentalUnitId?: string;

  @IsString()
  @IsOptional()
  public guestName?: string;

  @IsDateString()
  @IsOptional()
  public startDate?: string;

  @IsDateString()
  @IsOptional()
  public endDate?: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  public status?: ReservationStatus;
}
