import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICartItemService } from '../interfaces/icart_item-service.interface';
import { CartItem } from '../entities/cart_item.entity';
import { ICartItemRepository } from '../interfaces/icart_item-repository.interface';
import { Cart } from '../../cart/entities/cart.entity';
import { ProductRepository } from '../../products/products.repository';
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class CartItemService implements ICartItemService {
  constructor(
    @Inject(ICartItemRepository)
    private readonly _cartItemRepository: ICartItemRepository,
    private readonly _productRepository: ProductRepository,
  ) {}
  async addOrUpdateCartItem(
    cart: Cart,
    productIds: number[],
    quantity: number,
    action: 'add' | 'increase' | 'decrease' | 'update' = 'add',
  ): Promise<CartItem | null> {
    // Validate input - validate cho action 'add' và 'update'
    if ((action === 'add' || action === 'update') && quantity <= 0) {
      throw new BadRequestException('Số lượng phải lớn hơn 0');
    }

    // Check product tồn tại
    const product = await this._productRepository.findOne(productIds[0]);

    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // Lấy cart item hiện có (nếu có)
    const existingCartItem = await this._cartItemRepository.findByCartAndProduct(cart.id, productIds[0]);

    // Xử lý logic dựa trên action
    switch (action) {
      case 'add': {
        // Thêm sản phẩm vào giỏ hàng (cộng dồn quantity)
        const newQuantity = (existingCartItem?.quantity || 0) + quantity;

        // Kiểm tra tồn kho
        if (newQuantity > product.quantity) {
          throw new BadRequestException(
            `Tổng số lượng vượt quá số lượng trong kho. Hiện có: ${product.quantity}, yêu cầu: ${newQuantity}`,
          );
        }

        // Giá sau khi discount
        const discountedPrice = product.price * (1 - product.discount / 100);

        if (existingCartItem) {
          existingCartItem.quantity = newQuantity;
          existingCartItem.price = discountedPrice;
          existingCartItem.total_price = discountedPrice * newQuantity;
          return this._cartItemRepository.save(existingCartItem);
        }

        const newCartItem = new CartItem(cart, newQuantity, discountedPrice, product);
        newCartItem.total_price = discountedPrice * newQuantity;
        return this._cartItemRepository.save(newCartItem);
      }

      case 'update': {
        // Cập nhật quantity mới (không cộng dồn)
        const newQuantity = quantity;

        // Kiểm tra tồn kho
        if (newQuantity > product.quantity) {
          throw new BadRequestException(
            `Số lượng vượt quá số lượng trong kho. Hiện có: ${product.quantity}, yêu cầu: ${newQuantity}`,
          );
        }

        // Giá sau khi discount
        const discountedPrice = product.price * (1 - product.discount / 100);

        if (existingCartItem) {
          existingCartItem.quantity = newQuantity;
          existingCartItem.price = discountedPrice;
          existingCartItem.total_price = discountedPrice * newQuantity;
          return this._cartItemRepository.save(existingCartItem);
        }

        const newCartItem = new CartItem(cart, newQuantity, discountedPrice, product);
        newCartItem.total_price = discountedPrice * newQuantity;
        return this._cartItemRepository.save(newCartItem);
      }

      // case 'increase': {
      //   // Tăng quantity - chỉ hoạt động khi đã có cart item
      //   if (!existingCartItem) {
      //     throw new BadRequestException('Cart item không tồn tại để tăng quantity');
      //   }

      //   // const newQuantity = currenttQuantity + (newQuantityInput - currenttQuantity);

      //   // Kiểm tra tồn kho
      //   if (newQuantityInput > product.quantity) {
      //     throw new BadRequestException(
      //       `Số lượng sản phẩm trong kho không đủ. Hiện có: ${product.quantity}, yêu cầu: ${newQuantityInput}`,
      //     );
      //   }

      //   // Giá sau khi discount
      //   const discountedPrice = product.price * (1 - product.discount / 100);

      //   existingCartItem.quantity = newQuantityInput;
      //   existingCartItem.price = discountedPrice;
      //   existingCartItem.total_price = discountedPrice * newQuantityInput;
      //   return this._cartItemRepository.save(existingCartItem);
      // }

      // case 'decrease': {
      //   // Giảm quantity - chỉ hoạt động khi đã có cart item
      //   if (!existingCartItem) {
      //     throw new BadRequestException('Cart item không tồn tại để giảm quantity');
      //   }

      //   const newQuantity = quantity;

      //   // Nếu quantity = 0, xóa cart item
      //   if (newQuantity <= 0) {
      //     await this._cartItemRepository.remove(existingCartItem);
      //     return null;
      //   }

      //   // Giá sau khi discount
      //   const discountedPrice = product.price * (1 - product.discount / 100);

      //   existingCartItem.quantity = newQuantity;
      //   existingCartItem.price = discountedPrice;
      //   existingCartItem.total_price = discountedPrice * newQuantity;
      //   return this._cartItemRepository.save(existingCartItem);
      // }

      default:
        throw new BadRequestException('Action không hợp lệ');
    }
  }

  // Tạo cart item với product như một biến thể khi product variant không tồn tại

  private async createCartItemWithProductAsVariant(cart: Cart, product: Product, quantity: number): Promise<CartItem> {
    // Kiểm tra xem đã có cart item với product này chưa
    const existingCartItem = await this._cartItemRepository.findByCartAndProduct(cart.id, product.id);

    // Validate stock
    if (product.quantity < quantity) {
      throw new BadRequestException(
        `Số lượng sản phẩm trong kho không đủ. Hiện có: ${product.quantity}, yêu cầu: ${quantity}`,
      );
    }

    if (existingCartItem) {
      const newQuantity = quantity;

      // kiểm tra tổng số lượng không vượt quá số lượng có sẵn
      if (newQuantity > product.quantity) {
        throw new BadRequestException(
          `Tổng số lượng vượt quá số lượng trong kho. Hiện có: ${product.quantity}, yêu cầu: ${newQuantity}`,
        );
      }

      existingCartItem.quantity = newQuantity;
      existingCartItem.price = product.price;
      existingCartItem.total_price = product.price * newQuantity;
      return this._cartItemRepository.save(existingCartItem);
    }

    // Tạo cart item mới với product
    const newCartItem = new CartItem(cart, quantity, product.price, product);
    newCartItem.total_price = product.price * quantity;

    return this._cartItemRepository.save(newCartItem);
  }
  async findAll(): Promise<CartItem[]> {
    return this._cartItemRepository.findAll();
  }

  async findByIds(ids: number[], userId: number): Promise<CartItem[]> {
    // Lấy cart items theo id và userid
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

  async removeByIds(ids: number[], userId: number): Promise<CartItem[]> {
    // Xóa nhiều cart items theo IDs và đảm bảo thuộc về user
    const cartItems = await this._cartItemRepository.removeByIds(ids, userId);
    if (cartItems.length === 0) {
      throw new NotFoundException('Cart item không tồn tại');
    }
    return cartItems;
  }

  async addMultipleCartItems(cart: Cart, items: Array<{ productId: number; quantity: number }>): Promise<CartItem[]> {
    // Gộp sản phẩm trùng lặp
    const mergedMap = new Map<number, number>();
    for (const item of items) {
      const existing = mergedMap.get(item.productId) || 0;
      mergedMap.set(item.productId, existing + item.quantity);
    }

    const cartItems = [];
    for (const [productId, quantity] of mergedMap) {
      const cartItem = await this.addOrUpdateCartItem(cart, [productId], quantity);
      if (cartItem) {
        cartItems.push(cartItem);
      }
    }

    return cartItems;
  }

  async findByCartAndProduct(cartId: number, productId: number): Promise<CartItem | null> {
    return this._cartItemRepository.findByCartAndProduct(cartId, productId);
  }
}
