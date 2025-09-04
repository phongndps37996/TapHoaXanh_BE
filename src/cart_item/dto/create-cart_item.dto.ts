export class CreateCartItemDto {
  quantity!: number;

  total_price?: number;

  price?: number;

  productId!: number;

  cartId!: number;
}
