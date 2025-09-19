// dto/create-cart.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreateCartDto {
  @IsNumber({})
  @ApiProperty({ description: 'ID của sản phẩm biến thể', type: Number, example: 1 })
  productId!: number;

  @IsNumber()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  @ApiProperty({ description: 'Số lượng sản phẩm', minimum: 1 })
  quantity!: number;
}
