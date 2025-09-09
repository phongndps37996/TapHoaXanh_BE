import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateQuantityDto {
  @ApiProperty({
    description: 'Số lượng sản phẩm cần cập nhật',
    minimum: 0,
    example: 5,
  })
  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(0, { message: 'Số lượng phải lớn hơn hoặc bằng 0' })
  quantity!: number;
}
