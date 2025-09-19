// cart.service.ts
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Cart } from '../entities/cart.entity';
import { ICartService } from '../interfaces/icart-service.interface';
import { ICartRepository } from '../interfaces/icart-repository.interface';
import { ICartItemService } from '../../cart_item/interfaces/icart_item-service.interface';
import { CartAction } from 'src/types/common.enum';

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

  async addToCart(userId: number, productIds: number, quantity: number) {
    const cart = await this.FindOrCreateCart(userId);
    // Thêm sản phẩm vào giỏ hàng (cộng dồn quantity)
    cart && (await this._cartItemService.addOrUpdateCartItem(cart, [productIds], quantity, 'add'));
    const result = await this._cartRepository.findCartByUserId(userId);
    return result;
  }

  async updateCart(userId: number, productIds: number[], action: CartAction = CartAction.UPDATE, quantity: number) {
    const cart = await this.FindOrCreateCart(userId);
    if ([CartAction.UPDATE, CartAction.INCREASE, CartAction.DECREASE].includes(action)) {
      await this._cartItemService.addOrUpdateCartItem(
        cart,
        [productIds[0]],
        quantity,
        action as 'update' | 'increase' | 'decrease',
      );
    }

    if (action === CartAction.REMOVE) {
      try {
        const cartItemToRemove = await this._cartItemService.findByCartAndProduct(cart.id, productIds[0]);

        if (cartItemToRemove) {
          await this._cartItemService.removeByIds([cartItemToRemove.id], userId);
        }
      } catch (error) {
        throw new BadRequestException('Không tìm thấy sản phẩm trong giỏ hàng');
      }
    }

    if (action === CartAction.REMOVE_MULTIPLE) {
      try {
        await this._cartItemService.removeByIds(productIds, userId);
      } catch (error) {
        throw new BadRequestException('Không tìm thấy sản phẩm trong giỏ hàng');
      }
    }

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

  async removeMultipleCartItems(userId: number, productIds: number[]) {
    // Validate input
    if (!productIds || productIds.length === 0) {
      throw new BadRequestException('Danh sách sản phẩm không được rỗng');
    }

    // Giới hạn số lượng sản phẩm để tránh performance issues
    if (productIds.length > 100) {
      throw new BadRequestException('Tối đa 100 sản phẩm mỗi lần xóa khỏi giỏ hàng');
    }

    const cart = await this.FindOrCreateCart(userId);

    // Lấy tất cả cart items cần xóa
    const cartItemsToRemove = [];
    for (const productId of productIds) {
      const cartItem = await this._cartItemService.findByCartAndProduct(cart.id, productId);
      if (cartItem) {
        cartItemsToRemove.push(cartItem.id);
      }
    }

    // Xóa tất cả cart items cùng lúc
    if (cartItemsToRemove.length > 0) {
      await this._cartItemService.removeByIds(cartItemsToRemove, userId);
    }

    // Trả về cart đã cập nhật
    const result = await this._cartRepository.findCartByUserId(userId);
    return result;
  }

  async clearCartItems(userId: number) {
    await this._cartRepository.clearCartItems(userId);
    return await this._cartRepository.findCartByUserId(userId);
  }
}
