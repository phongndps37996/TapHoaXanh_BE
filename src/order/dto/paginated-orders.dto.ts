import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginatedOrdersDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    required: false,
    default: 1,
    minimum: 1,
    description: 'Page number (starts from 1)',
  })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    required: false,
    default: 10,
    minimum: 1,
    description: 'Number of items per page',
  })
  limit?: number = 10;
}
