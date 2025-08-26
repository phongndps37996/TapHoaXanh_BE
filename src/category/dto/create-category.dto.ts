import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'cá tươi' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  name!: string;

  @ApiProperty({ example: 'ca-tuoi' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  slug?: string;

  @ApiProperty({
    description: 'File ảnh cần upload',
    type: 'string',
    format: 'binary',
  })
  files!: any; // Sửa thành any thay vì any[] vì chỉ upload 1 file

  @ApiProperty({ example: 1 })
  parent_id!: number;
}
