import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min, ValidateIf, IsOptional, IsNotEmpty } from 'class-validator';
import { CartAction } from 'src/types/common.enum';

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
  @ApiProperty({ description: 'ID của sản phẩm', type: Number, isArray: true, example: [1, 2, 3] })
  @IsNumber({}, { each: true, message: 'Mỗi productId phải là số' })
  @IsNotEmpty()
  productIds!: number[];

  @ApiProperty({
    description: 'Hành động cập nhật',
    enum: CartAction,
    required: false,
    example: CartAction.UPDATE,
    default: CartAction.UPDATE,
  })
  @IsOptional()
  @IsEnum(CartAction, {
    message: 'action phải là update, increase, decrease hoặc remove',
  })
  action: CartAction = CartAction.UPDATE;

  @ApiProperty({ description: 'Số lượng sản phẩm (chỉ khi action=update)', minimum: 1, required: false, default: 1 })
  @ValidateIf((o) => !o.action || o.action === CartAction.UPDATE)
  @IsNumber()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity!: number;
}
