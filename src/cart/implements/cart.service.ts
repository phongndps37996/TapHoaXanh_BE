// cart.service.ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Cart } from '../entities/cart.entity';
import { ICartService } from '../interfaces/icart-service.interface';
import { ICartRepository } from '../interfaces/icart-repository.interface';
import { ICartItemService } from '../../cart_item/interfaces/icart_item-service.interface';

@Injectable()
export class CartService implements ICartService {
  constructor(
    @Inject(ICartRepository)
    private _cartRepository: ICartRepository,
    @Inject(ICartItemService)
    private _cartItemService: ICartItemService,
  ) {}

  async FindOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this._cartRepository.findCartByUserId(userId);
    if (!cart) {
      cart = await this._cartRepository.createCart(userId);
    }
    return cart;
  }

  async addToCart(userId: number, productId: number, quantity: number) {
    const cart = await this.FindOrCreateCart(userId);
    // 2. Gọi CartItemService để xử lý logic cart item
    cart && (await this._cartItemService.addOrUpdateCartItem(cart, productId, quantity));
    const result = await this._cartRepository.findCartByUserId(userId);
    return result;
  }

  async updateCart(userId: number, productId: number, quantity: number) {
    const cart = await this.FindOrCreateCart(userId);

    await this._cartItemService.addOrUpdateCartItem(cart, productId, quantity);

    // Trả về cart đã cập nhật
    const result = await this._cartRepository.findCartByUserId(userId);
    return result;
  }

  async addMultipleCart(userId: number, items: Array<{ productId: number; quantity: number }>) {
    // Validate input
    if (!items || items.length === 0) {
      throw new BadRequestException('Danh sách sản phẩm không được rỗng');
    }

    // Giới hạn số lượng sản phẩm để tránh performance issues
    if (items.length > 100) {
      throw new BadRequestException('Tối đa 100 sản phẩm mỗi lần thêm vào giỏ hàng');
    }

    const cart = await this.FindOrCreateCart(userId);

    // Gọi CartItemService để xử lý logic cart item
    await this._cartItemService.addMultipleCartItems(cart, items);

    // Trả về cart đã cập nhật
    const result = await this._cartRepository.findCartByUserId(userId);
    return result;
  }
}
