import { RentalUnitsService } from '@services/rental-units.service';
import { RentalUnitModel } from '@models/rental-unit.model';

jest.mock('@models/rental-unit.model');

describe('RentalUnitsService', () => {
  let service: RentalUnitsService;

  beforeEach(() => {
    service = new RentalUnitsService();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all rental units', async () => {
      const mockUnits = [{ _id: '1', name: 'Unit A' }];
      (RentalUnitModel.find as jest.Mock).mockResolvedValue(mockUnits);

      const result = await service.findAll();

      expect(result).toEqual(mockUnits);
      expect(RentalUnitModel.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a rental unit by id', async () => {
      const mockUnit = { _id: '507f1f77bcf86cd799439011', name: 'Unit A' };
      (RentalUnitModel.findById as jest.Mock).mockResolvedValue(mockUnit);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUnit);
      expect(RentalUnitModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw HttpException 404 when unit is not found', async () => {
      (RentalUnitModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('create', () => {
    it('should create a new rental unit', async () => {
      const dto = { name: 'New Unit', address: '123 Main St' };
      const mockUnit = { _id: '507f1f77bcf86cd799439011', ...dto };
      (RentalUnitModel.create as jest.Mock).mockResolvedValue(mockUnit);

      const result = await service.create(dto as never);

      expect(result).toEqual(mockUnit);
      expect(RentalUnitModel.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('should return the updated rental unit', async () => {
      const mockUnit = { _id: '507f1f77bcf86cd799439011', name: 'Updated Unit' };
      (RentalUnitModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUnit);

      const result = await service.update('507f1f77bcf86cd799439011', { name: 'Updated Unit' });

      expect(result).toEqual(mockUnit);
    });

    it('should throw HttpException 404 when unit to update is not found', async () => {
      (RentalUnitModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(service.update('999', { name: 'X' })).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('delete', () => {
    it('should delete a rental unit and return it', async () => {
      const mockUnit = { _id: '507f1f77bcf86cd799439011', name: 'Unit A' };
      (RentalUnitModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUnit);

      const result = await service.delete('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUnit);
    });

    it('should throw HttpException 404 when unit to delete is not found', async () => {
      (RentalUnitModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('999')).rejects.toMatchObject({ status: 404 });
    });
  });
});
