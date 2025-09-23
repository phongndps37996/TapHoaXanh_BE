import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReorderDto {
  @ApiProperty({
    description: 'Ghi chú cho đơn hàng mới (tùy chọn)',
    required: false,
    example: 'Mua lại đơn hàng cũ',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
