import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IAuthService } from '../interfaces/iauth-service.interface';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../../../public.decorator';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: IAuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Kiểm tra route có @Public hay không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 2. Lấy token từ cookie hoặc header
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Thiếu access token');
    }
    try {
      // 3. Verify token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      // 4. Check token có tồn tại trong DB không
      const tokenExists = await this.authService.verifyToken(token, payload.sub);
      if (!tokenExists) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // 5. Gắn user vào request
      request['user'] = payload;

      // 6. Kiểm tra role nếu có decorator @Roles
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (requiredRoles && !requiredRoles.includes(payload.role)) {
        throw new ForbiddenException('Không đủ quyền truy cập');
      }

      return true;
    } catch (err) {
      console.error('JwtGuard error:', err);
      throw new UnauthorizedException('Token không hợp lệ hoặc hết hạn');
    }
  }

  private extractToken(request: Request): string | undefined {
    // Ưu tiên lấy từ cookie
    const cookieToken = request.cookies?.['access_token'];
    if (cookieToken) return cookieToken;

    // Nếu không có cookie thì fallback sang Authorization header
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
