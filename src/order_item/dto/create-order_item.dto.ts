import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    example: 2,
    description: 'Số lượng sản phẩm trong đơn hàng',
  })
  quantity!: number;

  @ApiProperty({
    example: 150000,
    description: 'Giá của một sản phẩm',
  })
  unit_price!: number;

  @ApiProperty({
    example: 10,
    description: 'ID của đơn hàng',
  })
  orderId!: number;

  @ApiProperty({
    example: 3,
    description: 'ID của sản phẩm',
  })
  productId!: number;
}
