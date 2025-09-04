import { TokenActionType } from '../../types/common.enum';
import { Users } from '../../users/entities/users.entity';

export abstract class IAuthService {
  abstract register(dto: any): Promise<any>;
  abstract login(email: string, password: string): Promise<any>;
  abstract forgotPassword(email: string): Promise<any>;
  abstract verifyToken(token: string, userId: number): Promise<boolean>;
  abstract refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }>;
  abstract logout(userId: number): Promise<{ message: string }>;
  abstract generateActionToken(user: Users, actionType: TokenActionType, expiresIn: string): Promise<string>;
  abstract sendVerificationEmail(email: string): Promise<{ message: string }>;
  abstract sendVerificationEmailWithToken(email: string, token: string): Promise<void>;
  abstract sendResetPasswordEmailWithToken(email: string, token: string): Promise<void>;
  abstract resendForgotPassword(email: string): Promise<{ message: string }>;
  abstract verifyEmail(token: string): Promise<{ message: string; access_token: string; refresh_token: string }>;
  abstract resetPassword(token: string, newPassword: string): Promise<{ message: string }>;
}
