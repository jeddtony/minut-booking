import { IsString, IsOptional, IsNotEmpty, IsDateString, IsMongoId } from 'class-validator';

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
}
