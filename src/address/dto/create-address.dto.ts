import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    description: 'số nhà, đường',
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  street!: string;

  @ApiProperty({
    description: 'Thành phố',
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({
    description: 'Quận',
    example: '',
  })
  @IsString()
  @IsNotEmpty()
  district!: string;

  @ApiProperty({
    description: 'Mặc định',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
