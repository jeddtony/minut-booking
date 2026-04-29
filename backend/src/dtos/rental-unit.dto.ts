import { IsString, IsOptional, IsNotEmpty, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyType } from '@models/rental-unit.model';

export class CreateRentalUnitDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsString()
  @IsNotEmpty()
  public address!: string;

  @IsString()
  @IsNotEmpty()
  public city!: string;

  @IsString()
  @IsNotEmpty()
  public state!: string;

  @IsString()
  @IsNotEmpty()
  public postalCode!: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  public pricePerNight!: number;

  @IsEnum(PropertyType)
  public propertyType!: PropertyType;

  @IsString()
  @IsOptional()
  public description?: string;
}

export class UpdateRentalUnitDto {
  @IsString()
  @IsOptional()
  public name?: string;

  @IsString()
  @IsOptional()
  public address?: string;

  @IsString()
  @IsOptional()
  public city?: string;

  @IsString()
  @IsOptional()
  public state?: string;

  @IsString()
  @IsOptional()
  public postalCode?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  public pricePerNight?: number;

  @IsEnum(PropertyType)
  @IsOptional()
  public propertyType?: PropertyType;

  @IsString()
  @IsOptional()
  public description?: string;
}
