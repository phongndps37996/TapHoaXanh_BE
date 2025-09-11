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
import { DataSource } from 'typeorm';
import { OrderRepository } from './order.repository';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../order_item/entities/order_item.entity';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,

    @Inject(IUsersRepository) // 👈 inject đúng token
    private readonly userRepository: IUsersRepository,

    private readonly cartItemService: ICartItemService,

    private readonly orderItemService: OrderItemService,
    private readonly dataSource: DataSource,
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

  // Cập nhật trạng thái thanh toán kèm điều chỉnh tồn kho theo cơ chế "đặt chỗ" khi PENDING
  async updatePaymentStatusWithInventory(orderId: number, toStatus: PaymentStatus): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const order = await this.orderRepository.findWithItemsAndProducts(orderId);

      if (toStatus === PaymentStatus.PENDING) {
        // Đặt chỗ tồn kho ngay khi tạo/đặt PENDING
        for (const item of order.orderItem) {
          const product = item.product;
          if (!product) throw new BadRequestException('Sản phẩm không hợp lệ');
          if (product.quantity < item.quantity) {
            throw new BadRequestException(`Tồn kho không đủ cho sản phẩm ${product.id}`);
          }
          product.quantity -= item.quantity;
          await queryRunner.manager.getRepository(product.constructor as any).save(product);
        }
      }

      if (toStatus === PaymentStatus.FAIL) {
        // Hoàn kho khi thất bại
        for (const item of order.orderItem) {
          const product = item.product;
          if (!product) continue;
          product.quantity += item.quantity;
          await queryRunner.manager.getRepository(product.constructor as any).save(product);
        }
      }

      const updated = await this.orderRepository.updatePayment(orderId, { status: toStatus });
      await queryRunner.commitTransaction();
      return updated;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async countNumberOfOrder(year: number, month?: number): Promise<number> {
    return this.orderRepository.countNumberOfOrder(year, month);
  }

  // Tạo order từ cart items được chọn
  async createOrderFromCart(createOrderDto: CreateOrderFromCartDto, userId: number): Promise<Order> {
    const cartItems = await this.cartItemService.findByIds(createOrderDto.cartItemIds, userId);
    if (cartItems.length === 0) {
      throw new BadRequestException('Không có sản phẩm nào được chọn');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Tính tổng và chuẩn bị order items
      let totalPrice = 0;
      const preparedItems: { quantity: number; unit_price: number; product: Product }[] = [];

      for (const cartItem of cartItems) {
        if (!cartItem.product) {
          throw new BadRequestException(`Cart item ${cartItem.id} không có sản phẩm hợp lệ`);
        }

        const product = await queryRunner.manager
          .getRepository(Product)
          .findOne({ where: { id: cartItem.product.id } });
        if (!product) {
          throw new NotFoundException('Sản phẩm không tồn tại');
        }

        // Check tồn kho và trừ kho (đặt chỗ) ngay khi tạo PENDING
        if (product.quantity < cartItem.quantity) {
          throw new BadRequestException(
            `Tồn kho không đủ cho sản phẩm ${product.id}. Còn: ${product.quantity}, yêu cầu: ${cartItem.quantity}`,
          );
        }
        product.quantity -= cartItem.quantity;
        await queryRunner.manager.getRepository(Product).save(product);

        totalPrice += cartItem.price * cartItem.quantity;
        preparedItems.push({ quantity: cartItem.quantity, unit_price: cartItem.price, product });
      }

      // Tạo và lưu order ở trạng thái PENDING
      const order = this.orderRepository.create({
        total_price: totalPrice,
        note: createOrderDto.note,
        order_code: this.generateOrderCode(),
        status: PaymentStatus.PENDING,
      });

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User này không tồn tại');
      }
      order.user = user;
      const savedOrder = await queryRunner.manager.getRepository(Order).save(order as any);

      // Tạo order items trực tiếp trong transaction
      for (const item of preparedItems) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          quantity: item.quantity,
          unit_price: item.unit_price,
          order: savedOrder,
          product: item.product,
        });
        await queryRunner.manager.save(orderItem);
      }

      await queryRunner.commitTransaction();

      // Xóa cart items đã đưa vào order (ngoài transaction hiện tại)
      await this.cartItemService.removeByIds(createOrderDto.cartItemIds, userId);

      return savedOrder;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async getTotalRevenueSuccess(year: number, month?: number) {
    return await this.orderRepository.getTotalRevenueSuccess(year, month);
  }

  async getMonthlyRevenueSuccess(year: number) {
    return await this.orderRepository.getMonthlyRevenueSuccess(year);
  }

  async getOrderDetailByCode(orderCode: string) {
    return await this.orderRepository.getOrderDetailByCode(orderCode);
  }
}
