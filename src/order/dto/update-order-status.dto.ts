import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của đơn hàng',
    enum: OrderStatus,
    example: OrderStatus.CONFIRMED,
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiProperty({
    description: 'Ghi chú khi cập nhật trạng thái (tùy chọn)',
    required: false,
    example: 'Đơn hàng đã được xác nhận và chuẩn bị giao',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
