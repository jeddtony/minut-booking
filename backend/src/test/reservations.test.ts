import { ReservationsService } from '@services/reservations.service';
import { ReservationModel } from '@models/reservation.model';
import { RentalUnitModel } from '@models/rental-unit.model';

jest.mock('@models/reservation.model');
jest.mock('@models/rental-unit.model');

const VALID_UNIT_ID = '507f1f77bcf86cd799439011';
const VALID_RESERVATION_ID = '507f191e810c19729de860ea';

describe('ReservationsService', () => {
  let service: ReservationsService;

  beforeEach(() => {
    service = new ReservationsService();
    jest.clearAllMocks();
  });

  const mockQueryChain = (resolvedData: unknown[]) => {
    const limitMock = jest.fn().mockResolvedValue(resolvedData);
    const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
    const populateMock = jest.fn().mockReturnValue({ skip: skipMock });
    (ReservationModel.find as jest.Mock).mockReturnValue({ populate: populateMock });
    (ReservationModel.countDocuments as jest.Mock).mockResolvedValue(resolvedData.length);
    return { limitMock, skipMock };
  };

  describe('findAll', () => {
    it('should return paginated reservations with meta', async () => {
      const mockReservations = [{ _id: VALID_RESERVATION_ID, guestName: 'Alice' }];
      mockQueryChain(mockReservations);

      const result = await service.findAll();

      expect(result.data).toEqual(mockReservations);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10, totalPages: 1 });
      expect(ReservationModel.find).toHaveBeenCalledWith({});
    });

    it('should filter by rentalUnitId', async () => {
      mockQueryChain([]);

      await service.findAll(VALID_UNIT_ID);

      expect(ReservationModel.find).toHaveBeenCalledWith(expect.objectContaining({ rentalUnitId: VALID_UNIT_ID }));
    });

    it('should use overlap logic when both startDate and endDate are provided', async () => {
      mockQueryChain([]);

      await service.findAll(undefined, '2025-07-01', '2025-07-31');

      expect(ReservationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $and: [{ startDate: { $lt: new Date('2025-07-31') } }, { endDate: { $gt: new Date('2025-07-01') } }],
        }),
      );
    });

    it('should filter by startDate only using endDate > startDate', async () => {
      mockQueryChain([]);

      await service.findAll(undefined, '2025-07-01');

      expect(ReservationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ endDate: { $gt: new Date('2025-07-01') } }),
      );
    });

    it('should filter by endDate only using startDate < endDate', async () => {
      mockQueryChain([]);

      await service.findAll(undefined, undefined, '2025-07-31');

      expect(ReservationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: { $lt: new Date('2025-07-31') } }),
      );
    });

    it('should throw 400 for an invalid rentalUnitId', async () => {
      await expect(service.findAll('not-a-valid-id')).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('findById', () => {
    it('should return a reservation by id', async () => {
      const mockReservation = { _id: VALID_RESERVATION_ID, guestName: 'Bob' };
      const populateMock = jest.fn().mockResolvedValue(mockReservation);
      (ReservationModel.findById as jest.Mock).mockReturnValue({ populate: populateMock });

      const result = await service.findById(VALID_RESERVATION_ID);

      expect(result).toEqual(mockReservation);
    });

    it('should throw 404 when reservation is not found', async () => {
      const populateMock = jest.fn().mockResolvedValue(null);
      (ReservationModel.findById as jest.Mock).mockReturnValue({ populate: populateMock });

      await expect(service.findById(VALID_RESERVATION_ID)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('create', () => {
    it('should throw 404 when the referenced rental unit does not exist', async () => {
      (RentalUnitModel.findById as jest.Mock).mockResolvedValue(null);

      const dto = { rentalUnitId: VALID_UNIT_ID, guestName: 'Carol', startDate: '2025-06-01', endDate: '2025-06-07' };

      await expect(service.create(dto)).rejects.toMatchObject({ status: 404 });
    });

    it('should throw 400 when startDate is not before endDate', async () => {
      (RentalUnitModel.findById as jest.Mock).mockResolvedValue({ _id: VALID_UNIT_ID });

      const dto = { rentalUnitId: VALID_UNIT_ID, guestName: 'Dave', startDate: '2025-06-07', endDate: '2025-06-01' };

      await expect(service.create(dto)).rejects.toMatchObject({ status: 400 });
    });

    it('should create a reservation successfully', async () => {
      const mockUnit = { _id: VALID_UNIT_ID };
      const mockReservation = { _id: VALID_RESERVATION_ID, guestName: 'Eve' };
      (RentalUnitModel.findById as jest.Mock).mockResolvedValue(mockUnit);
      (ReservationModel.create as jest.Mock).mockResolvedValue(mockReservation);

      const dto = { rentalUnitId: VALID_UNIT_ID, guestName: 'Eve', startDate: '2025-06-01', endDate: '2025-06-07' };
      const result = await service.create(dto);

      expect(result).toEqual(mockReservation);
    });
  });

  describe('delete', () => {
    it('should throw 404 when reservation to delete is not found', async () => {
      (ReservationModel.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      await expect(service.delete(VALID_RESERVATION_ID)).rejects.toMatchObject({ status: 404 });
    });
  });
});
