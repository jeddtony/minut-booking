import { IRentalUnit, RentalUnitModel } from '@models/rental-unit.model';
import { CreateRentalUnitDto, UpdateRentalUnitDto } from '@dtos/rental-unit.dto';
import { HttpException } from '@exceptions/HttpException';
import { PaginatedResult } from '@interfaces/pagination.interface';
import { getPresignedUrl } from '@utils/s3';

export type RentalUnitResponse = Omit<IRentalUnit, 'imageKey'> & {
  imageKey?: string;
  imageUrl?: string;
};

export class RentalUnitsService {
  private async toResponse(unit: IRentalUnit): Promise<RentalUnitResponse> {
    const obj = unit.toObject() as RentalUnitResponse;
    if (obj.imageKey) {
      obj.imageUrl = await getPresignedUrl(obj.imageKey);
    }
    return obj;
  }

  public async findAll(page = 1, limit = 10): Promise<PaginatedResult<RentalUnitResponse>> {
    const skip = (page - 1) * limit;
    const [units, total] = await Promise.all([
      RentalUnitModel.find().skip(skip).limit(limit),
      RentalUnitModel.countDocuments(),
    ]);
    const data = await Promise.all(units.map(u => this.toResponse(u)));
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  public async findById(id: string): Promise<RentalUnitResponse> {
    const unit = await RentalUnitModel.findById(id);
    if (!unit) throw new HttpException(404, `Rental unit with id ${id} not found`);
    return this.toResponse(unit);
  }

  public async create(dto: CreateRentalUnitDto, imageKey?: string): Promise<RentalUnitResponse> {
    const unit = await RentalUnitModel.create({ ...dto, imageKey });
    return this.toResponse(unit);
  }

  public async update(id: string, dto: UpdateRentalUnitDto, imageKey?: string): Promise<RentalUnitResponse> {
    const payload = { ...dto, ...(imageKey ? { imageKey } : {}) };
    const unit = await RentalUnitModel.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!unit) throw new HttpException(404, `Rental unit with id ${id} not found`);
    return this.toResponse(unit);
  }

  public async delete(id: string): Promise<RentalUnitResponse> {
    const unit = await RentalUnitModel.findByIdAndDelete(id);
    if (!unit) throw new HttpException(404, `Rental unit with id ${id} not found`);
    return this.toResponse(unit);
  }
}
