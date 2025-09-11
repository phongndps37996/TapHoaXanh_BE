import { Cart } from '../entities/cart.entity';

export abstract class ICartRepository {
  abstract findCartByUserId(userId: number): Promise<Cart | null>;
  abstract createCart(userId: number): Promise<Cart>;
  abstract clearCartItems(userId: number): Promise<void>;
}
