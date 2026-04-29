import { IRentalUnit, RentalUnitModel } from '@models/rental-unit.model';
import { CreateRentalUnitDto, UpdateRentalUnitDto } from '@dtos/rental-unit.dto';
import { HttpException } from '@exceptions/HttpException';

export class RentalUnitsService {
  public async findAll(): Promise<IRentalUnit[]> {
    return RentalUnitModel.find();
  }

  public async findById(id: string): Promise<IRentalUnit> {
    const unit = await RentalUnitModel.findById(id);
    if (!unit) throw new HttpException(404, `Rental unit with id ${id} not found`);
    return unit;
  }

  public async create(dto: CreateRentalUnitDto): Promise<IRentalUnit> {
    return RentalUnitModel.create(dto);
  }

  public async update(id: string, dto: UpdateRentalUnitDto): Promise<IRentalUnit> {
    const unit = await RentalUnitModel.findByIdAndUpdate(id, dto, { new: true, runValidators: true });
    if (!unit) throw new HttpException(404, `Rental unit with id ${id} not found`);
    return unit;
  }

  public async delete(id: string): Promise<IRentalUnit> {
    const unit = await RentalUnitModel.findByIdAndDelete(id);
    if (!unit) throw new HttpException(404, `Rental unit with id ${id} not found`);
    return unit;
  }
}
