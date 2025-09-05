import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class FilterOrderDto {
  @IsOptional()
  @ApiProperty({ required: false })
  search?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  status?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  page?: number;

  @IsOptional()
  @ApiProperty({ required: false })
  limit?: number;

  @IsOptional()
  @ApiProperty({ required: false })
  start_date?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  end_date?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  month?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  year?: string;
}
