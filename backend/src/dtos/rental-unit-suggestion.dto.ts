import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class SuggestRentalUnitsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'description must be at least 3 characters' })
  @MaxLength(2000, { message: 'description must be at most 2000 characters' })
  public description!: string;
}
