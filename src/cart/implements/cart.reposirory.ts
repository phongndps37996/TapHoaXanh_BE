import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { ICartRepository } from '../interfaces/icart-repository.interface';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly dataSource: DataSource,
  ) {}

  async findCartByUserId(userId: number): Promise<Cart | null> {
    const a = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['cartItems', 'cartItems.product'],
    });
    return a;
  }

  async createCart(userId: number): Promise<Cart> {
    await this.resetAutoIncrement();
    const cart = this.cartRepository.create({
      user: { id: userId },
      cartItems: [],
    });
    return this.cartRepository.save(cart);
  }

  async removeItem(id: number) {
    return this.cartRepository.delete(id);
  }

  async clearCart(userId: number) {
    await this.cartRepository.delete({ user: { id: userId } });
    await this.resetAutoIncrement();
    return { success: true };
  }

  private async resetAutoIncrement(): Promise<void> {
    await this.dataSource.query('ALTER TABLE cart AUTO_INCREMENT = 1');
  }
}
