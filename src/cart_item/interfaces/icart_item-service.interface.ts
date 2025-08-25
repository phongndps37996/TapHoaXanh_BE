import { Cart } from '../../cart/entities/cart.entity';
import { CartItem } from '../entities/cart_item.entity';

export abstract class ICartItemService {
  [x: string]: any;
  abstract addOrUpdateCartItem(cart: Cart, productId: number, quantity: number): Promise<CartItem>;
  abstract remove(id: number): Promise<void>;
  abstract findAll(): Promise<CartItem[]>;
  abstract findByIds(ids: number[], userId: number): Promise<CartItem[]>;
  abstract removeByIds(ids: number[], userId: number): Promise<void>;
}
