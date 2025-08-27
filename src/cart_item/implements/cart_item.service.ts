import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICartItemService } from '../interfaces/icart_item-service.interface';
import { CartItem } from '../entities/cart_item.entity';
import { ICartItemRepository } from '../interfaces/icart_item-repository.interface';
import { Cart } from '../../cart/entities/cart.entity';
import { ProductRepository } from '../../products/products.repository';
import { ProductVariantRepository } from '../../product-variant/product-variant.repository';
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class CartItemService implements ICartItemService {
  constructor(
    @Inject(ICartItemRepository)
    private readonly _cartItemRepository: ICartItemRepository,
    private readonly _productRepository: ProductRepository,
    @Inject(ProductVariantRepository)
    private readonly _productVariantRepository: ProductVariantRepository,
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

    // Tìm product variant
    const productVariant = await this._productVariantRepository.findOneByProductId(product.id);

    // Nếu không có product variant, sử dụng product như một biến thể
    if (!productVariant) {
      return this.createCartItemWithProductAsVariant(cart, product, quantity);
    }

    // Nếu có product variant, chỉ lưu product variant (không lưu product)
    const existingCartItem = await this._cartItemRepository.findByCartAndProductVariant(cart.id, productVariant.id);

    // Validate stock - bắt lỗi khi quantity không đủ
    if (productVariant.stock < quantity) {
      throw new BadRequestException(
        `Số lượng sản phẩm trong kho không đủ. Hiện có: ${productVariant.stock}, yêu cầu: ${quantity}`,
      );
    }

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;

      // Xác nhận tổng số lượng không vượt product biến thể có sẵn
      if (newQuantity > productVariant.stock) {
        throw new BadRequestException(
          `Tổng số lượng vượt quá số lượng trong kho. Hiện có: ${productVariant.stock}, yêu cầu: ${newQuantity}`,
        );
      }

      existingCartItem.quantity = newQuantity;
      existingCartItem.price = productVariant.price_modifier;
      existingCartItem.total_price = productVariant.price_modifier * newQuantity;
      // Chỉ lưu product variant, không lưu product
      existingCartItem.product_variant = productVariant;
      existingCartItem.product = undefined;

      return this._cartItemRepository.save(existingCartItem);
    }

    // thêm cart item mới chỉ với product variant (không có product)
    const newCartItem = new CartItem(cart, quantity, productVariant.price_modifier, undefined, productVariant);
    newCartItem.total_price = productVariant.price_modifier * quantity;

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
