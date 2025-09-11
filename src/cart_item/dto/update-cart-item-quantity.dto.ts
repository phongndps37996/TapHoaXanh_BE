import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateCartItemQuantityDto {
  @ApiProperty({
    description: 'Hành động thực hiện',
    enum: ['increase', 'decrease'],
    example: 'increase',
  })
  @IsEnum(['increase', 'decrease'], {
    message: 'Action phải là increase hoặc decrease',
  })
  action!: 'increase' | 'decrease';
}
