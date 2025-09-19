import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ArrayMinSize } from 'class-validator';

export class RemoveCartItemsDto {
  @ApiProperty({
    description: 'Danh sách ID của các cart item cần xóa',
    type: [Number],
    example: [1, 2, 3],
    minItems: 1,
  })
  @IsArray({ message: 'ids phải là một mảng' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 ID để xóa' })
  @IsNumber({}, { each: true, message: 'Mỗi ID phải là số' })
  ids!: number[];
}
