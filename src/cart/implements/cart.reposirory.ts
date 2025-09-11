import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CartItem } from '../../cart_item/entities/cart_item.entity';
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

  async clearCartItems(userId: number): Promise<void> {
    // Chỉ lấy cart id, tránh load toàn bộ relations
    await this.resetAutoIncrement();
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });
    if (!cart) return;

    // Xóa toàn bộ cart_item theo quan hệ cart.id (không phụ thuộc tên cột DB)
    const cartItemRepo = this.dataSource.getRepository(CartItem);
    await cartItemRepo.delete({ cart: { id: cart.id } as any });
  }

  private async resetAutoIncrement(): Promise<void> {
    await this.dataSource.query('ALTER TABLE cart AUTO_INCREMENT = 1');
  }
}
