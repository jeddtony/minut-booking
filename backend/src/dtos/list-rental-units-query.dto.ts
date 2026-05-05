import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PropertyType } from '@models/rental-unit.model';

@ValidatorConstraint({ name: 'minPriceLteMaxPrice', async: false })
class MinPriceLteMaxPriceConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const o = args.object as ListRentalUnitsQueryDto;
    if (o.minPrice === undefined || o.maxPrice === undefined) return true;
    return o.minPrice <= o.maxPrice;
  }

  defaultMessage(): string {
    return 'minPrice must not exceed maxPrice';
  }
}

@Validate(MinPriceLteMaxPriceConstraint)
export class ListRentalUnitsQueryDto {
  @Transform(({ value }) => {
    const n = parseInt(String(value), 10);
    if (value === undefined || value === '' || value === null || !Number.isFinite(n)) return 1;
    return Math.max(1, n);
  })
  @IsInt()
  @Min(1)
  public page!: number;

  @Transform(({ value }) => {
    const n = parseInt(String(value), 10);
    if (value === undefined || value === '' || value === null || !Number.isFinite(n)) return 10;
    return Math.min(100, Math.max(1, n));
  })
  @IsInt()
  @Min(1)
  @Max(100)
  public limit!: number;

  @IsOptional()
  @IsString()
  public city?: string;

  @IsOptional()
  @IsString()
  public state?: string;

  @IsOptional()
  @IsEnum(PropertyType)
  public propertyType?: PropertyType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseFloat(String(value));
    return Number.isFinite(n) ? n : Number.NaN;
  })
  @IsNumber()
  public minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const n = parseFloat(String(value));
    return Number.isFinite(n) ? n : Number.NaN;
  })
  @IsNumber()
  public maxPrice?: number;
}

