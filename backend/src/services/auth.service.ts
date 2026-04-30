import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser, UserModel } from '@models/user.model';
import { RegisterDto, LoginDto } from '@dtos/auth.dto';
import { HttpException } from '@exceptions/HttpException';
import { TokenPayload } from '@interfaces/auth.interface';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '@config';

export type AuthTokens = { accessToken: string; refreshToken: string };
export type AuthResult = { user: Partial<IUser>; accessToken: string; refreshToken: string };

export class AuthService {
  private generateTokens(user: IUser): AuthTokens {
    const payload: TokenPayload = { id: user._id.toString(), email: user.email };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  public async register(dto: RegisterDto): Promise<AuthResult> {
    const exists = await UserModel.findOne({ email: dto.email });
    if (exists) throw new HttpException(409, `Email ${dto.email} is already registered`);

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await UserModel.create({ name: dto.name, email: dto.email, password: hashed });

    const { accessToken, refreshToken } = this.generateTokens(user);
    await UserModel.findByIdAndUpdate(user._id, { refreshToken });

    return { user: { _id: user._id, name: user.name, email: user.email }, accessToken, refreshToken };
  }

  public async login(dto: LoginDto): Promise<AuthResult> {
    const user = await UserModel.findOne({ email: dto.email });
    if (!user) throw new HttpException(401, 'Invalid email or password');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new HttpException(401, 'Invalid email or password');

    const { accessToken, refreshToken } = this.generateTokens(user);
    await UserModel.findByIdAndUpdate(user._id, { refreshToken });

    return { user: { _id: user._id, name: user.name, email: user.email }, accessToken, refreshToken };
  }

  public async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
    } catch {
      throw new HttpException(401, 'Invalid or expired refresh token');
    }

    const user = await UserModel.findById(payload.id);
    if (!user || user.refreshToken !== token) throw new HttpException(401, 'Refresh token revoked');

    const tokens = this.generateTokens(user);
    await UserModel.findByIdAndUpdate(user._id, { refreshToken: tokens.refreshToken });

    return tokens;
  }

  public async logout(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(userId, { refreshToken: null });
  }

  public async getMe(userId: string): Promise<IUser> {
    const user = await UserModel.findById(userId).select('-password -refreshToken');
    if (!user) throw new HttpException(404, 'User not found');
    return user;
  }
}
