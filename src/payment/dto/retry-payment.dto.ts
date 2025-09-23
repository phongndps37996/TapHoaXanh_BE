import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class RetryPaymentDto {
  @ApiProperty({ example: 123, description: 'ID của order cần retry payment' })
  @IsNumber()
  @IsNotEmpty()
  orderId!: number;
}
