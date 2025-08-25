import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 500000, description: 'Tổng giá đơn hàng' })
  @IsNumber()
  @IsNotEmpty()
  total_price!: number;

  @ApiPropertyOptional({ example: 'Giao trong giờ hành chính', description: 'Ghi chú đơn hàng' })
  @IsString()
  @IsOptional()
  note?: string;
}
