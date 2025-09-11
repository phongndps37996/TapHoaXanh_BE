import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCartItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNumber()
  productId!: number;

  @ApiProperty({
    description: 'Số lượng sản phẩm',
    minimum: 1,
    example: 2,
  })
  @IsNumber()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity!: number;

  @ApiProperty({
    description: 'Hành động thực hiện',
    enum: ['add', 'update'],
    example: 'add',
    required: false,
    default: 'add',
  })
  @IsOptional()
  @IsEnum(['add', 'update'], {
    message: 'Action phải là add hoặc update',
  })
  action?: 'add' | 'update' = 'add';
}
