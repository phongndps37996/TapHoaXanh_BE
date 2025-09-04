import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICartItemService } from '../interfaces/icart_item-service.interface';
import { CartItem } from '../entities/cart_item.entity';
import { ICartItemRepository } from '../interfaces/icart_item-repository.interface';
import { Cart } from '../../cart/entities/cart.entity';
import { ProductRepository } from '../../products/products.repository';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class CartItemService implements ICartItemService {
  constructor(
    @Inject(ICartItemRepository)
    private readonly _cartItemRepository: ICartItemRepository,
    private readonly _productRepository: ProductRepository,
  ) {}
  async addOrUpdateCartItem(cart: Cart, productId: number, quantity: number): Promise<CartItem> {
    // Validate quantity - bắt lỗi khi quantity = 0
    if (quantity <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0');
    }

    // Validate product exists - bắt lỗi khi product không tồn tại
    const product = await this._productRepository.findOne(productId);

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    const existingCartItem = await this._cartItemRepository.findByCartAndProduct(cart.id, productId);

    // Tính giá sản phẩm sau khi áp dụng discount
    const discountedPrice = product.price * (1 - product.discount / 100);

    // Validate stock - bắt lỗi khi quantity không đủ (sử dụng purchase field làm stock)
    if (product.purchase < quantity) {
      throw new BadRequestException(
        `Số lượng sản phẩm trong kho không đủ. Hiện có: ${product.purchase}, yêu cầu: ${quantity}`,
      );
    }

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;

      // Xác nhận tổng số lượng không vượt quá số lượng có sẵn
      if (newQuantity > product.purchase) {
        throw new BadRequestException(
          `Tổng số lượng vượt quá số lượng trong kho. Hiện có: ${product.purchase}, yêu cầu: ${newQuantity}`,
        );
      }

      existingCartItem.quantity = newQuantity;
      existingCartItem.price = discountedPrice;
      existingCartItem.total_price = discountedPrice * newQuantity;

      return this._cartItemRepository.save(existingCartItem);
    }

    const newCartItem = new CartItem(cart, quantity, discountedPrice, product);
    newCartItem.total_price = discountedPrice * quantity;

    return this._cartItemRepository.save(newCartItem);
  }

  /**
   * Tạo cart item với product như một biến thể khi product variant không tồn tại
   */
  private async createCartItemWithProductAsVariant(cart: Cart, product: Product, quantity: number): Promise<CartItem> {
    // Kiểm tra xem đã có cart item với product này chưa
    const existingCartItem = await this._cartItemRepository.findByCartAndProduct(cart.id, product.id);

    // Validate stock - sử dụng purchase field của product như stock
    if (product.purchase < quantity) {
      throw new BadRequestException(
        `Số lượng sản phẩm trong kho không đủ. Hiện có: ${product.purchase}, yêu cầu: ${quantity}`,
      );
    }

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;

      // Xác nhận tổng số lượng không vượt product có sẵn
      if (newQuantity > product.purchase) {
        throw new BadRequestException(
          `Tổng số lượng vượt quá số lượng trong kho. Hiện có: ${product.purchase}, yêu cầu: ${newQuantity}`,
        );
      }

      existingCartItem.quantity = newQuantity;
      existingCartItem.price = product.price;
      existingCartItem.total_price = product.price * newQuantity;
      return this._cartItemRepository.save(existingCartItem);
    }

    // Tạo cart item mới với product như một biến thể
    const newCartItem = new CartItem(cart, quantity, product.price, product);
    newCartItem.total_price = product.price * quantity;

    return this._cartItemRepository.save(newCartItem);
  }
  async findAll(): Promise<CartItem[]> {
    return this._cartItemRepository.findAll();
  }

  async findByIds(ids: number[], userId: number): Promise<CartItem[]> {
    // Lấy cart items theo IDs và đảm bảo thuộc về user
    const cartItems = await this._cartItemRepository.findByIds(ids, userId);
    return cartItems;
  }

  async remove(id: number): Promise<void> {
    const cartItem = await this._cartItemRepository.findOne(id);
    if (!cartItem) {
      throw new NotFoundException('Cart item không tồn tại');
    }
    await this._cartItemRepository.remove(cartItem);
  }

  async removeByIds(ids: number[], userId: number): Promise<void> {
    // Xóa nhiều cart items theo IDs và đảm bảo thuộc về user
    await this._cartItemRepository.removeByIds(ids, userId);
  }
}
