import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({
    description: 'Nội dung đánh giá',
    example: 'Sản phẩm rất tốt, giao hàng nhanh!',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @ApiProperty({
    description: 'Số sao đánh giá (1-5)',
    example: 5,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @ApiProperty({
    description: 'ID của người dùng đã đánh giá',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  user_id?: number;

  @IsOptional()
  @ApiProperty({
    description: 'ID sản phẩm được đánh giá',
    example: 42,
  })
  @IsNotEmpty()
  @IsInt()
  product_id?: number;
}
