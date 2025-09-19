import { Cart } from '../../cart/entities/cart.entity';
import { CartItem } from '../entities/cart_item.entity';

export abstract class ICartItemService {
  abstract addOrUpdateCartItem(
    cart: Cart,
    productIds: number[],
    quantity?: number,
    action?: 'add' | 'increase' | 'decrease' | 'update',
  ): Promise<CartItem | null>;
  abstract addMultipleCartItems(cart: Cart, items: Array<{ productId: number; quantity: number }>): Promise<CartItem[]>;
  abstract remove(id: number): Promise<void>;
  abstract findAll(): Promise<CartItem[]>;
  abstract findByIds(ids: number[], userId: number): Promise<CartItem[]>;
  abstract removeByIds(ids: number[], userId: number): Promise<CartItem[]>;
  abstract findByCartAndProduct(cartId: number, productId: number): Promise<CartItem | null>;
}
