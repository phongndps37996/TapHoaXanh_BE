import { Injectable, UnauthorizedException, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from '../dto/register.dto';
import { IUsersRepository } from '../../users/interfaces/iusers-repository.interface';
import * as nodemailer from 'nodemailer';
import { IAuthService } from '../interfaces/iauth-service.interface';
import { JwtService } from '@nestjs/jwt';
import { IAuthRepository } from '../interfaces/iauth-repository.interface';
import { Token } from '../entities/token.entity';
import { Users } from '../../users/entities/users.entity';
import { TokenActionType } from '../../types/common.enum';
@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(IUsersRepository) private readonly _userRepository: IUsersRepository,
    @Inject(IAuthRepository) private readonly _authRepository: IAuthRepository,
    private readonly _jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterAuthDto) {
    const existUser = await this._userRepository.findByEmail(registerDto.email);
    if (existUser) throw new NotFoundException('Email đã tồn tại');
    if (registerDto.password !== registerDto.confirmPassword) throw new BadRequestException('Mật khẩu không khớp.');

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this._userRepository.createUser({
      ...registerDto,
      password: hashedPassword,
    });
    //gữi email xác thực
    await this.sendVerificationEmail(user.email);

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
    };
  }

  async login(email: string, password: string) {
    const user = await this._userRepository.findByEmail(email); //tìm người dùng theo email
    if (!user) throw new UnauthorizedException('Sai email hoặc mật khẩu'); //nếu không thể tìm thấy người dùng thì ném lỗi
    const isMatch = await bcrypt.compare(password, user.password); //so sánh mật khẩu đã nhập với mật khẩu đã mã hóa trong cơ sở dữ liệu
    if (!isMatch) throw new UnauthorizedException('Sai email hoặc mật khẩu'); //nếu mật khẩu không khớp thì ném lỗi
    // const { password: _, ...userWithoutPassword } = user;
    const { access_token, refresh_token } = await this.generateToken(user); //gọi generateToken để tạo access_token và refresh_token cho người dùng

    await this._authRepository.createToken(new Token(access_token, refresh_token, user)); //lưu token vào cơ sở dữ liệu
    return { access_token, refresh_token };
  }

  async generateToken(user: Users): Promise<{ access_token: string; refresh_token: string }> {
    const payload = { sub: user.id, role: user.role }; //tạo payload chứa thông tin người dùng
    const refresh_token = await this._jwtService.signAsync(payload, {
      secret: process.env.REFRESH_JWT_SECRET,
      expiresIn: '7d',
    }); //tạo refresh_token
    const token = await this._jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1d',
    });
    return { access_token: token, refresh_token: refresh_token };
  }

  async refreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    const payload = await this._jwtService.verifyAsync(refreshToken, {
      secret: process.env.REFRESH_JWT_SECRET,
    }); //xác thực refresh_token

    const refreshTokenExists = await this._authRepository.checkRefreshToken(refreshToken, payload.sub); //kiểm tra xem refresh_token có tồn tại trong cơ sở dữ liệu hay không
    if (!refreshTokenExists) throw new UnauthorizedException('Refresh token không hợp lệ');
    const user = await this._userRepository.findById(payload.sub); //lấy thông tin người dùng từ cơ sở dữ liệu theo id trong payload
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    const { access_token, refresh_token } = await this.generateToken(user); //tạo access_token và refresh_token mới
    await this._authRepository.createToken(new Token(access_token, refresh_token, user)); //lưu token mới vào cơ sở dữ liệu
    //create at delete old token
    return { access_token, refresh_token };
  }

  async verifyToken(token: string, userId: number): Promise<boolean> {
    //TODO: Check if token exists in database with userId
    return await this._authRepository.checkTokenByUserId(userId, token);
  }
  async logout(userId: number): Promise<{ message: string }> {
    await this._authRepository.deleteTokenByUserId(userId);
    return { message: 'Đăng xuất thành công.' };
  }

  async generateActionToken(user: Users, actionType: TokenActionType, expiresIn: string = '5m'): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      action: actionType,
      type: 'action',
    };

    // Use secret for action tokens
    return await this._jwtService.signAsync(payload, {
      secret: process.env.ACTION_JWT_SECRET,
      expiresIn: expiresIn,
    });
  }

  async sendVerificationEmail(email: string) {
    const user = await this._userRepository.findByEmail(email); //tìm người dùng theo email
    if (!user) throw new NotFoundException('Email không tồn tại'); //nếu không tìm thấy người dùng thì ném lỗi
    if (user.isEmailVerified) throw new BadRequestException('Email đã được xác thực'); //nếu email đã được xác thực thì ném lỗi

    const verificationToken = await this.generateActionToken(user, TokenActionType.VERIFY_EMAIL, '15m'); //tạo token xác thực

    await this.sendVerificationEmailWithToken(email, verificationToken);

    return { message: 'Email xác thực đã được gửi' };
  }

  async sendVerificationEmailWithToken(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'phongndps37996@gmail.com',
        pass: 'idff zvtr tggn ebcy',
      },
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await transporter.sendMail({
      from: '"TapHoaXanh" <phongndps37996@gmail.com>',
      to: email,
      subject: 'Xác thực email tài khoản Tạp Hóa Xanh',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Xác thực email</h2>
          <p style="color: #666; font-size: 16px; text-align: center; margin: 20px 0;">
            Vui lòng click vào nút bên dưới để xác thực email:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/verify-email?token=${token}" 
               style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Xác thực email
            </a>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Link này sẽ hết hạn sau 5 phút.
          </p>
        </div>
      `,
    });
  }

  async verifyEmail(token: string) {
    try {
      const payload = await this._jwtService.verifyAsync(token, {
        secret: process.env.ACTION_JWT_SECRET,
      });

      if (payload.action !== TokenActionType.VERIFY_EMAIL || payload.type !== 'action') {
        throw new BadRequestException('Token không hợp lệ');
      }

      const user = await this._userRepository.findById(payload.sub);
      if (!user) throw new NotFoundException('Người dùng không tồn tại');

      // Cập nhật trạng thái email verified
      await this._userRepository.updateEmailVerification(payload.sub, true);

      // Tạo access token và refresh token cho user đã verify
      const { access_token, refresh_token } = await this.generateToken(user);
      await this._authRepository.createToken(new Token(access_token, refresh_token, user));

      return {
        message: 'Xác thực email thành công',
        access_token,
        refresh_token,
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Link xác thực đã hết hạn');
      }
      throw error;
    }
  }
  async forgotPassword(email: string) {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new NotFoundException('Email không tồn tại!');

    const resetToken = await this.generateActionToken(user, TokenActionType.RESET_PASSWORD, '5m');

    await this.sendResetPasswordEmailWithToken(email, resetToken);

    return { message: 'Link đặt lại mật khẩu đã được gửi qua email.' };
  }

  async sendResetPasswordEmailWithToken(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'phongndps37996@gmail.com',
        pass: 'idff zvtr tggn ebcy',
      },
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await transporter.sendMail({
      from: '"TapHoaXanh" <phongndps37996@gmail.com>',
      to: email,
      subject: 'Đặt lại mật khẩu tài khoản Tạp Hóa Xanh',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Đặt lại mật khẩu</h2>
          <p style="color: #666; font-size: 16px; text-align: center; margin: 20px 0;">
            Vui lòng click vào nút bên dưới để đặt lại mật khẩu:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/reset-password?token=${token}" 
               style="background-color: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            Link này sẽ hết hạn sau 5 phút.
          </p>
        </div>
      `,
    });
  }

  async resendForgotPassword(email: string) {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new NotFoundException('Email không tồn tại!');

    const resetToken = await this.generateActionToken(user, TokenActionType.RESET_PASSWORD, '5m');

    await this.sendResetPasswordEmailWithToken(email, resetToken);

    return { message: 'Link đặt lại mật khẩu đã được gửi lại qua email.' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = await this._jwtService.verifyAsync(token, {
        secret: process.env.ACTION_JWT_SECRET,
      });

      if (payload.action !== TokenActionType.RESET_PASSWORD || payload.type !== 'action') {
        throw new BadRequestException('Token không hợp lệ');
      }

      const user = await this._userRepository.findById(payload.sub);
      if (!user) throw new NotFoundException('Người dùng không tồn tại');

      // Cập nhật mật khẩu mới
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this._userRepository.updatePassword(user.email, hashedPassword);

      return { message: 'Đặt lại mật khẩu thành công' };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ vui lòng thử lại');
      }
      throw error;
    }
  }
}
