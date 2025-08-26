import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

// src/order/dto/create-order-from-cart.dto.ts
export class CreateOrderFromCartDto {
  @IsArray()
  @IsNumber({}, { each: true })
  cartItemIds!: number[]; // IDs của các cart items được chọn

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsNumber()
  voucherId?: number; // ID của voucher nếu có
}
