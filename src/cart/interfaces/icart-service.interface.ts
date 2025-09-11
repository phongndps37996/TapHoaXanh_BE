import { Cart } from '../entities/cart.entity';

export abstract class ICartService {
  abstract FindOrCreateCart(userId: number): Promise<Cart>;
  abstract addToCart(userId: number, productId: number, quantity: number): Promise<any>;
  abstract updateCart(
    userId: number,
    productId: number,
    quantityOrOne: number,
    action?: 'update' | 'increase' | 'decrease',
  ): Promise<any>;
  abstract addMultipleCart(userId: number, items: Array<{ productId: number; quantity: number }>): Promise<any>;
  abstract clearCartItems(userId: number): Promise<any>;
}
