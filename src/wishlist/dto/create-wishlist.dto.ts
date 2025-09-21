import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class CreateWishlistDto {
  @IsOptional()
  @ApiProperty({ example: 1, description: 'ID sản phẩm' })
  productId?: number;
}
