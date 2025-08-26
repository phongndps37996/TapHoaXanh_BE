import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { ForgotPasswordAuthDto } from './dto/forgot-password.dto';
import { LoginAuthDto } from './dto/login.dto';
import { RegisterAuthDto } from './dto/register.dto';
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
}
