import { Injectable } from '@nestjs/common';
import { ICartItemRepository } from '../interfaces/icart_item-repository.interface';
import { CartItem } from '../entities/cart_item.entity';
import { DataSource, Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CartItemRepository implements ICartItemRepository {
  constructor(
    @InjectRepository(CartItem)
    private readonly _cartItemRepository: Repository<CartItem>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCartAndProduct(cartId: number, productId: number): Promise<CartItem | null> {
    return this._cartItemRepository.findOne({
      where: { cart: { id: cartId }, product: { id: productId } },
      relations: ['cart', 'product'],
    });
  }

  async save(cartItem: CartItem): Promise<CartItem> {
    return this._cartItemRepository.save(cartItem);
  }
  async remove(cartItem: CartItem): Promise<void> {
    await this._cartItemRepository.remove(cartItem);
    await this.resetAutoIncrement();
  }

  async findOne(id: number): Promise<CartItem | null> {
    return this._cartItemRepository.findOne({
      where: { id },
      relations: ['cart', 'product'],
    });
  }

  async findAll(): Promise<CartItem[]> {
    return this._cartItemRepository.find({
      relations: ['cart', 'product'],
    });
  }

  async findByIds(ids: number[], userId: number): Promise<CartItem[]> {
    // Lấy cart items theo IDs và đảm bảo thuộc về user
    const items = await this._cartItemRepository.find({
      where: { id: In(ids) },
      relations: ['cart', 'product', 'cart.user'],
    });
    return items.filter((item) => item.cart.user.id === userId);
  }

  async removeByIds(ids: number[], userId: number): Promise<void> {
    // Xóa nhiều cart items theo IDs và đảm bảo thuộc về user
    const items = await this.findByIds(ids, userId);
    for (const item of items) {
      await this.remove(item);
    }
  }

  async resetAutoIncrement(): Promise<void> {
    await this.dataSource.query('ALTER TABLE cart_item AUTO_INCREMENT = 1');
  }
}
