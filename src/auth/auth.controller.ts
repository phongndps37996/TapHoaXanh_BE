import { Body, Controller, Post, Req, UseGuards, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ForgotPasswordAuthDto } from './dto/forgot-password.dto';
import { LoginAuthDto } from './dto/login.dto';
import { RegisterAuthDto } from './dto/register.dto';
import { ResetPasswordAuthDto } from './dto/reset-password.dto';
import { JwtGuard } from './guards/jwt.guard';
import { IAuthService } from './interfaces/iauth-service.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({
    summary: 'Đăng nhập',
  })
  @Post('login')
  async login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordAuthDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('refresh-token')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string' },
      },
    },
  })
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    const userId = req.user.sub;
    return this.authService.logout(userId);
  }

  @ApiOperation({
    summary: 'Xác thực email',
    description: 'Xác thực email khi user click link từ email',
  })
  @Get('verify-email')
  @ApiQuery({ name: 'token', description: 'Token xác thực từ email' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @ApiOperation({
    summary: 'Gửi lại email xác thực',
    description: 'Gửi lại email xác thực nếu user chưa nhận được',
  })
  @Post('resend-verification')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@gmail.com' },
      },
    },
  })
  async resendVerification(@Body('email') email: string) {
    return this.authService.sendVerificationEmail(email);
  }

  @ApiOperation({
    summary: 'Gửi lại link đặt lại mật khẩu',
    description: 'Gửi lại link đặt lại mật khẩu nếu user chưa nhận được email',
  })
  @Post('resend-forgot-password')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@gmail.com' },
      },
    },
  })
  async resendForgotPassword(@Body('email') email: string) {
    return this.authService.resendForgotPassword(email);
  }

  @ApiOperation({
    summary: 'Đặt lại mật khẩu',
    description: 'Đặt lại mật khẩu khi user click link từ email',
  })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordAuthDto) {
    // Kiểm tra password có khớp không
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu không khớp');
    }

    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
