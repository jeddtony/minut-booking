import { AuthService } from '@services/auth.service';
import { UserModel } from '@models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

jest.mock('@models/user.model');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const MOCK_USER_ID = '507f1f77bcf86cd799439011';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw 409 when email is already registered', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({ email: 'taken@test.com' });

      await expect(service.register({ name: 'Taken', email: 'taken@test.com', password: 'password123' })).rejects.toMatchObject({ status: 409 });
    });

    it('should hash the password and return tokens on success', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
      const mockUser = { _id: MOCK_USER_ID, name: 'New User', email: 'new@test.com', toString: () => MOCK_USER_ID };
      (UserModel.create as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      const result = await service.register({ name: 'New User', email: 'new@test.com', password: 'password123' });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result.accessToken).toBe('mock_token');
      expect(result.user).toMatchObject({ email: 'new@test.com' });
    });
  });

  describe('login', () => {
    it('should throw 401 when user is not found', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.login({ email: 'nobody@test.com', password: 'pass' })).rejects.toMatchObject({ status: 401 });
    });

    it('should throw 401 when password does not match', async () => {
      (UserModel.findOne as jest.Mock).mockResolvedValue({ email: 'user@test.com', password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login({ email: 'user@test.com', password: 'wrongpass' })).rejects.toMatchObject({ status: 401 });
    });

    it('should return tokens on valid credentials', async () => {
      const mockUser = { _id: MOCK_USER_ID, email: 'user@test.com', password: 'hashed', toString: () => MOCK_USER_ID };
      (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock_token');

      const result = await service.login({ email: 'user@test.com', password: 'password123' });

      expect(result.accessToken).toBe('mock_token');
      expect(result.refreshToken).toBe('mock_token');
    });
  });

  describe('refresh', () => {
    it('should throw 401 when refresh token is invalid', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

      await expect(service.refresh('bad_token')).rejects.toMatchObject({ status: 401 });
    });

    it('should throw 401 when stored token does not match', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({ id: MOCK_USER_ID, email: 'user@test.com' });
      (UserModel.findById as jest.Mock).mockResolvedValue({ _id: MOCK_USER_ID, refreshToken: 'different_token' });

      await expect(service.refresh('provided_token')).rejects.toMatchObject({ status: 401 });
    });

    it('should return new tokens when refresh token is valid', async () => {
      const mockUser = { _id: MOCK_USER_ID, email: 'user@test.com', refreshToken: 'valid_token', toString: () => MOCK_USER_ID };
      (jwt.verify as jest.Mock).mockReturnValue({ id: MOCK_USER_ID, email: 'user@test.com' });
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('new_mock_token');

      const result = await service.refresh('valid_token');

      expect(result.accessToken).toBe('new_mock_token');
    });
  });

  describe('logout', () => {
    it('should clear the stored refresh token', async () => {
      (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await service.logout(MOCK_USER_ID);

      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(MOCK_USER_ID, { refreshToken: null });
    });
  });
});
