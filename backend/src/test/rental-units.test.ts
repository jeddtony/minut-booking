import { RentalUnitsService } from '@services/rental-units.service';
import { RentalUnitModel } from '@models/rental-unit.model';

jest.mock('@models/rental-unit.model');
jest.mock('@utils/s3', () => ({
  uploadToS3: jest.fn().mockResolvedValue('rental-units/mock-key.jpg'),
  getPresignedUrl: jest.fn().mockResolvedValue('https://mock-bucket.s3.amazonaws.com/rental-units/mock-key.jpg'),
}));

const makeMock = (fields: object) => ({ ...fields, toObject: jest.fn().mockReturnValue(fields) });

describe('RentalUnitsService', () => {
  let service: RentalUnitsService;

  beforeEach(() => {
    service = new RentalUnitsService();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated rental units with meta', async () => {
      const mockUnit = makeMock({ _id: '1', name: 'Unit A' });
      const limitMock = jest.fn().mockResolvedValue([mockUnit]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      (RentalUnitModel.find as jest.Mock).mockReturnValue({ skip: skipMock });
      (RentalUnitModel.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result.data[0]).toMatchObject({ _id: '1', name: 'Unit A' });
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('should calculate totalPages correctly', async () => {
      const limitMock = jest.fn().mockResolvedValue([]);
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      (RentalUnitModel.find as jest.Mock).mockReturnValue({ skip: skipMock });
      (RentalUnitModel.countDocuments as jest.Mock).mockResolvedValue(25);

      const result = await service.findAll(2, 10);

      expect(result.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
      expect(skipMock).toHaveBeenCalledWith(10); // (2-1) * 10
    });
  });

  describe('findById', () => {
    it('should return a rental unit by id', async () => {
      const mockUnit = makeMock({ _id: '507f1f77bcf86cd799439011', name: 'Unit A' });
      (RentalUnitModel.findById as jest.Mock).mockResolvedValue(mockUnit);

      const result = await service.findById('507f1f77bcf86cd799439011');

      expect(result).toMatchObject({ _id: '507f1f77bcf86cd799439011', name: 'Unit A' });
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
      const mockUnit = makeMock({ _id: '507f1f77bcf86cd799439011', ...dto });
      (RentalUnitModel.create as jest.Mock).mockResolvedValue(mockUnit);

      const result = await service.create(dto as never);

      expect(result).toMatchObject({ name: 'New Unit' });
      expect(RentalUnitModel.create).toHaveBeenCalledWith({ ...dto, imageKey: undefined });
    });
  });

  describe('update', () => {
    it('should return the updated rental unit', async () => {
      const mockUnit = makeMock({ _id: '507f1f77bcf86cd799439011', name: 'Updated Unit' });
      (RentalUnitModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUnit);

      const result = await service.update('507f1f77bcf86cd799439011', { name: 'Updated Unit' });

      expect(result).toMatchObject({ name: 'Updated Unit' });
    });

    it('should throw HttpException 404 when unit to update is not found', async () => {
      (RentalUnitModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(service.update('999', { name: 'X' })).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('delete', () => {
    it('should delete a rental unit and return it', async () => {
      const mockUnit = makeMock({ _id: '507f1f77bcf86cd799439011', name: 'Unit A' });
      (RentalUnitModel.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUnit);

      const result = await service.delete('507f1f77bcf86cd799439011');

      expect(result).toMatchObject({ _id: '507f1f77bcf86cd799439011' });
    });

    it('should throw HttpException 404 when unit to delete is not found', async () => {
      (RentalUnitModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('999')).rejects.toMatchObject({ status: 404 });
    });
  });
});
