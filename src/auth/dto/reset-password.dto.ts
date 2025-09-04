import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordAuthDto {
  @ApiProperty({
    example: 'jwt_token_here',
    description: 'Token reset password từ email',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Mật khẩu mới',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Xác nhận mật khẩu mới',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}
