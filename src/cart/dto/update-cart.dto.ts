import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

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

  @ApiProperty({ description: 'Số lượng sản phẩm', minimum: 0 })
  @IsNumber()
  @Min(0, { message: 'Số lượng phải lớn hơn hoặc bằng 0' })
  quantity!: number;
}
