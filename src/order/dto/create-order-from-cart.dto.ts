import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderFromCartDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'IDs của các cart items được chọn để thanh toán',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  cartItemIds!: number[];

  @ApiPropertyOptional({
    example: 'Giao trong giờ hành chính',
    description: 'Ghi chú đơn hàng',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID của voucher nếu có',
  })
  @IsOptional()
  @IsNumber()
  voucherId?: number;

  @ApiProperty({
    example: 1,
    description: 'ID của địa chỉ giao hàng',
  })
  @IsNumber()
  addressId!: number;
}
