import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateRentalUnitDto {
  @IsString()
  @IsNotEmpty()
  public name!: string;

  @IsString()
  @IsOptional()
  public address?: string;
}

export class UpdateRentalUnitDto {
  @IsString()
  @IsOptional()
  public name?: string;

  @IsString()
  @IsOptional()
  public address?: string;
}
