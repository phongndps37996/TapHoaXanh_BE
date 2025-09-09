import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
  @IsNumber({}, { message: 'ID sản phẩm phải là số' })
  productId!: number;

  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity!: number;
}

export class AddMultipleCartItemsDto {
  @ApiProperty({
    description: 'Danh sách sản phẩm cần thêm vào giỏ hàng',
    type: [CartItemDto],
    example: [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ],
  })
  @IsArray({ message: 'Danh sách sản phẩm phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[];
}
