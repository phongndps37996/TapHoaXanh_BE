import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreateCartItemDto {
  @ApiProperty({ description: 'Số lượng sản phẩm', minimum: 1 })
  @IsNumber()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity!: number;

  @ApiProperty({ description: 'Tổng giá', required: false })
  total_price?: number;

  @ApiProperty({ description: 'Giá sản phẩm', required: false })
  price?: number;

  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNumber()
  productId!: number;

  @ApiProperty({ description: 'ID giỏ hàng' })
  @IsNumber()
  cartId!: number;
}
