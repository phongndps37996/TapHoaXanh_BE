import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateNewsDto {
  @ApiProperty({ description: 'Tên bài viết', example: 'Tin tức về sản phẩm mới' })
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    description: 'Danh sách hình ảnh (JSON string)',
    example: '["image1.jpg", "image2.jpg"]',
    required: false,
  })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'Nội dung chi tiết bài viết', example: 'Nội dung đầy đủ của bài viết...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Loại bài viết', example: 'news', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'ID tác giả', example: 1, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  author_id?: number;

  @ApiProperty({ description: 'Bình luận', example: 'Nội dung hay', required: false })
  @IsString()
  @IsOptional()
  comment?: string;
}
