import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Order ID',
    example: 1,
  })
  @Type(() => Number)
  orderId!: number;
}
