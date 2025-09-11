import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min, ValidateIf, IsOptional } from 'class-validator';

export class CartItemUpdateDto {
  @ApiProperty({ description: 'ID của sản phẩm' })
  @IsNumber()
  productId!: number;

  @ApiProperty({ description: 'Số lượng sản phẩm', minimum: 0 })
  @IsNumber()
  @Min(0, { message: 'Số lượng phải lớn hơn hoặc bằng 0' })
  quantity!: number;
}

export class UpdateCartDto {
  @ApiProperty({ description: 'ID của sản phẩm' })
  @IsNumber()
  productId!: number;

  @ApiProperty({
    description: 'Hành động cập nhật',
    enum: ['update', 'increase', 'decrease'],
    required: false,
    example: 'update',
    default: 'update',
  })
  @IsOptional()
  @IsEnum(['update', 'increase', 'decrease'], {
    message: 'action phải là update, increase hoặc decrease',
  })
  action?: 'update' | 'increase' | 'decrease' = 'update';

  @ApiProperty({ description: 'Số lượng sản phẩm (chỉ khi action=update)', minimum: 1, required: false })
  @ValidateIf((o) => !o.action || o.action === 'update')
  @IsNumber()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity?: number;
}
