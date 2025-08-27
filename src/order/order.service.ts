import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICartItemService } from '../cart_item/interfaces/icart_item-service.interface';
import { OrderItemService } from '../order_item/order_item.service';
import { v4 as uuidv4 } from 'uuid';
import { IUsersRepository } from '../users/interfaces/iusers-repository.interface';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { OrderRepository } from './order.repository';
import { ProductVariantRepository } from '../product-variant/product-variant.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,

    @Inject(IUsersRepository) // 👈 inject đúng token
    private readonly userRepository: IUsersRepository,

    private readonly cartItemService: ICartItemService,

    private readonly orderItemService: OrderItemService,

    private readonly productVariantRepository: ProductVariantRepository,
  ) {}

  // Order CRUD operations
  async create(createOrderDto: CreateOrderDto, userId: number): Promise<Order> {
    // Tạo order_code tự động bằng UUID
    const orderCode = this.generateOrderCode();

    const order = this.orderRepository.create({
      ...createOrderDto,
      order_code: orderCode,
      status: PaymentStatus.PENDING,
    });
    const findUser = await this.userRepository.findById(userId);
    if (!findUser) throw new NotFoundException('User này không tồn tại');
    order.user = findUser;
    return this.orderRepository.save(order);
  }

  // Tạo order_code tự động bằng UUID
  private generateOrderCode(): string {
    const uuid = uuidv4();
    // Lấy 8 ký tự đầu của UUID và thêm prefix ORD
    return `${uuid.toUpperCase()}`;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.findAll();
  }

  async filterAllOrder(query: FilterOrderDto) {
    return this.orderRepository.filterAllOrder(query);
  }

  async findOne(id: number): Promise<Order> {
    return this.orderRepository.findOne(id);
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    return this.orderRepository.updateOrder(id, updateOrderDto);
  }

  async remove(id: number): Promise<void> {
    const result = await this.orderRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(`Order with id ${id} not found`);
  }

  async countNumberOfOrder(): Promise<number> {
    return this.orderRepository.countNumberOfOrder();
  }

  // src/order/order.service.t
  // Tạo order từ cart items được chọn
  async createOrderFromCart(createOrderDto: CreateOrderFromCartDto, userId: number): Promise<Order> {
    // 1. Lấy cart items được chọn
    const cartItems = await this.cartItemService.findByIds(createOrderDto.cartItemIds, userId);

    // 2. Validate cart items
    if (cartItems.length === 0) {
      throw new BadRequestException('Không có sản phẩm nào được chọn');
    }

    // 3. Tính tổng tiền
    let totalPrice = 0;
    const orderItems: {
      quantity: number;
      unit_price: number;
      productVariant: any;
      product: any;
    }[] = [];

    for (const cartItem of cartItems) {
      const itemTotal = cartItem.price * cartItem.quantity;
      totalPrice += itemTotal;

      // Tạo order item - kiểm tra cả product và product_variant
      if (!cartItem.product_variant && !cartItem.product) {
        throw new BadRequestException(`Cart item ${cartItem.id} không có sản phẩm hợp lệ`);
      }

      orderItems.push({
        quantity: cartItem.quantity,
        unit_price: cartItem.price,
        productVariant: cartItem.product_variant,
        product: cartItem.product,
      });
    }

    // 6. Tạo order
    const order = this.orderRepository.create({
      total_price: totalPrice,
      note: createOrderDto.note,
      order_code: this.generateOrderCode(),
      status: PaymentStatus.PENDING,
    });

    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException('User này không tồn tại');
    order.user = user;

    // 5. Lưu order
    const savedOrder = await this.orderRepository.save(order);

    // 6. Tạo order items
    for (const item of orderItems) {
      if (item.productVariant) {
        // Nếu có product variant, tạo order item với product variant
        await this.orderItemService.create({
          quantity: item.quantity,
          unit_price: item.unit_price,
          orderId: savedOrder.id,
          productVariantId: item.productVariant.id,
        });
      } else if (item.product) {
        // Nếu chỉ có product (không có variant), tìm hoặc tạo product variant mặc định
        let defaultVariant = await this.productVariantRepository.findOneByProductId(item.product.id);

        if (!defaultVariant) {
          // Tạo product variant mặc định cho product
          defaultVariant = await this.productVariantRepository.create({
            variant_name: 'Mặc định',
            image_url: item.product.images,
            price_modifier: 0,
            stock: item.product.purchase,
            product: item.product,
          });
          await this.productVariantRepository.save(defaultVariant);
        }

        await this.orderItemService.create({
          quantity: item.quantity,
          unit_price: item.unit_price,
          orderId: savedOrder.id,
          productVariantId: defaultVariant.id,
        });
      }
    }

    // 7. Xóa cart items đã thanh toán
    await this.cartItemService.removeByIds(createOrderDto.cartItemIds, userId);

    return savedOrder;
  }

  async getTotalRevenueSuccess() {
    return await this.orderRepository.getTotalRevenueSuccess();
  }

  async getMonthlyRevenueSuccess(year: number) {
    return await this.orderRepository.getMonthlyRevenueSuccess(year);
  }
}
