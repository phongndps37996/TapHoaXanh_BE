import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IAuthService } from '../interfaces/iauth-service.interface';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: IAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const access_Token = this.extractTokenFromHeader(request);
    // console.log('🚀 ~ JwtGuard ~ canActivate ~ access_Token:', access_Token);

    if (!access_Token) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    try {
      const payload = await this.jwtService.verifyAsync(access_Token, {
        secret: process.env.JWT_SECRET,
        ignoreExpiration: false,
      });
      //Check if the token exists in the database
      const tokenExists = await this.authService.verifyToken(access_Token, payload.sub);
      if (!tokenExists) {
        throw new UnauthorizedException('Token không hợp lệ');
      }
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('lỗi user');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
