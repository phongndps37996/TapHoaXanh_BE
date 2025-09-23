import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICartItemService } from '../cart_item/interfaces/icart_item-service.interface';
import { OrderItemService } from '../order_item/order_item.service';
import { v4 as uuidv4 } from 'uuid';
import { IUsersRepository } from '../users/interfaces/iusers-repository.interface';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { FilterOrderDto } from './dto/filter-order.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ReorderDto } from './dto/reorder.dto';
import { Order } from './entities/order.entity';
import { PaymentStatus } from './enums/payment-status.enum';
import { OrderStatus } from './enums/order-status.enum';
import { DataSource } from 'typeorm';
import { OrderRepository } from './order.repository';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../order_item/entities/order_item.entity';
import { Voucher } from '../voucher/entities/voucher.entity';
import { VoucherType } from '../voucher/enums/voucher-type.enum';
import { Payment } from '../payment/entities/payment.entity';
import { Address } from '../address/entities/address.entity';

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
      status: OrderStatus.PENDING,
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
  async findAllOwned(userId: number): Promise<Order[]> {
    return this.orderRepository.findAllOwned(userId);
  }

  async findOwnedOrdersPaginated(userId: number, query: PaginatedOrdersDto) {
    return this.orderRepository.findOwnedOrdersPaginated(userId, query);
  }

  async findOne(id: number): Promise<Order> {
    return this.orderRepository.findOne(id);
  }

  // Lấy địa chỉ đã chọn trong đơn hàng
  async getOrderAddress(orderId: number): Promise<any> {
    return this.orderRepository.getOrderAddress(orderId);
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

      const updated = await this.orderRepository.updatePayment(orderId, { status: toStatus as any });
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

  // Helper function để tính discount từ voucher
  private calculateVoucherDiscount(totalPrice: number, voucher: Voucher): number {
    // Xử lý voucher có type null (có thể là voucher cũ hoặc free shipping)
    if (voucher.type === null || voucher.type === undefined) {
      // Nếu type null, coi như giảm cố định bằng max_discount
      const discount = Math.min(voucher.max_discount, totalPrice);
      return discount;
    }

    if (voucher.type === VoucherType.PERCENTAGE) {
      // Giảm theo phần trăm
      const discount = (totalPrice * voucher.value) / 100;
      // Giới hạn tối đa theo max_discount
      const finalDiscount = Math.min(discount, voucher.max_discount);
      return finalDiscount;
    }

    if (voucher.type === VoucherType.NORMAL) {
      // Giảm cố định
      const discount = Math.min(voucher.value, totalPrice);
      return discount;
    }

    return 0;
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
      // 1. Tính tổng và chuẩn bị order items
      const { totalPrice, preparedItems } = await this.prepareOrderItems(cartItems, queryRunner);

      // 2. Tạo order cơ bản
      const order = await this.createBasicOrder(createOrderDto, userId, totalPrice);

      // 3. Xử lý voucher nếu có
      const finalTotalPrice = await this.processVoucherIfExists(
        createOrderDto.voucherId,
        totalPrice,
        order,
        queryRunner,
      );

      // 4. Cập nhật total price và lưu order
      order.total_price = finalTotalPrice;
      const savedOrder = await queryRunner.manager.getRepository(Order).save(order as any);

      // 5. Tạo order items
      await this.createOrderItems(preparedItems, savedOrder, queryRunner);

      // 6. Cập nhật address nếu có
      if (createOrderDto.addressId) {
        const address = await queryRunner.manager.getRepository(Address).findOne({
          where: { id: createOrderDto.addressId, users: { id: userId } },
        });
        if (address) {
          savedOrder.address = address;
          await queryRunner.manager.getRepository(Order).save(savedOrder);
        }
      }

      await queryRunner.commitTransaction();

      // 7. Xóa cart items (ngoài transaction)
      await this.cartItemService.removeByIds(createOrderDto.cartItemIds, userId);

      return savedOrder;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  // 1. Chuẩn bị order items và tính tổng giá
  private async prepareOrderItems(
    cartItems: any[],
    queryRunner: any,
  ): Promise<{ totalPrice: number; preparedItems: any[] }> {
    let totalPrice = 0;
    const preparedItems: { quantity: number; unit_price: number; product: Product }[] = [];

    for (const cartItem of cartItems) {
      if (!cartItem.product) {
        throw new BadRequestException(`Cart item ${cartItem.id} không có sản phẩm hợp lệ`);
      }

      const product = await queryRunner.manager.getRepository(Product).findOne({ where: { id: cartItem.product.id } });
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

    return { totalPrice, preparedItems };
  }

  // 2. Tạo order cơ bản
  private async createBasicOrder(
    createOrderDto: CreateOrderFromCartDto,
    userId: number,
    totalPrice: number,
  ): Promise<Order> {
    const order = this.orderRepository.create({
      total_price: totalPrice,
      note: createOrderDto.note,
      order_code: this.generateOrderCode(),
      status: OrderStatus.PENDING,
    });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User này không tồn tại');
    }
    order.user = user;

    // Thêm address nếu có
    if (createOrderDto.addressId) {
      const address = await this.dataSource.getRepository(Address).findOne({
        where: { id: createOrderDto.addressId, users: { id: userId } },
      });
      if (!address) {
        throw new NotFoundException('Địa chỉ không tồn tại hoặc không thuộc về user này');
      }
      order.address = address;
    }

    return order;
  }

  // 3. Xử lý voucher nếu có
  private async processVoucherIfExists(
    voucherId: number | undefined,
    totalPrice: number,
    order: Order,
    queryRunner: any,
  ): Promise<number> {
    if (!voucherId) {
      return totalPrice;
    }

    const voucher = await this.validateAndGetVoucher(voucherId, totalPrice, queryRunner);

    const discount = this.calculateVoucherDiscount(totalPrice, voucher);
    const finalTotalPrice = Math.max(0, totalPrice - discount);

    // Cập nhật voucher quantity
    await this.updateVoucherQuantity(voucher, queryRunner);

    // Gán voucher vào order
    order.voucher = [voucher];

    return finalTotalPrice;
  }

  // 3.1. Validate và lấy voucher
  private async validateAndGetVoucher(voucherId: number, totalPrice: number, queryRunner: any): Promise<Voucher> {
    const voucher = await queryRunner.manager.getRepository(Voucher).findOne({ where: { id: voucherId } });

    if (!voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }

    // Kiểm tra voucher còn hạn và còn số lượng
    if (voucher.quantity <= 0) {
      throw new BadRequestException('Voucher đã hết lượt sử dụng');
    }

    const now = new Date();
    if (now < voucher.start_date || now > voucher.end_date) {
      throw new BadRequestException('Voucher không còn hiệu lực');
    }

    // Kiểm tra điều kiện sử dụng voucher
    if (totalPrice < voucher.min_order_value) {
      throw new BadRequestException(`Đơn hàng phải tối thiểu ${voucher.min_order_value} để sử dụng voucher này`);
    }

    return voucher;
  }

  // 3.2. Cập nhật số lượng voucher
  private async updateVoucherQuantity(voucher: Voucher, queryRunner: any): Promise<void> {
    voucher.quantity -= 1;
    if (voucher.quantity === 0) {
      voucher.is_used = true;
    }

    await queryRunner.manager.getRepository(Voucher).save(voucher);
  }

  // 4. Tạo order items
  private async createOrderItems(preparedItems: any[], savedOrder: Order, queryRunner: any): Promise<void> {
    for (const item of preparedItems) {
      const orderItem = queryRunner.manager.create(OrderItem, {
        quantity: item.quantity,
        unit_price: item.unit_price,
        order: savedOrder,
        product: item.product,
      });
      await queryRunner.manager.save(orderItem);
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

  // Cập nhật trạng thái đơn hàng (Admin)
  async updateOrderStatus(orderId: number, updateStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.orderRepository.findWithItemsAndProducts(orderId);
    if (!order) {
      throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại`);
    }

    // Validate trạng thái hiện tại và trạng thái mới
    this.validateStatusTransition(order.status, updateStatusDto.status);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Cập nhật trạng thái đơn hàng
      order.status = updateStatusDto.status;
      if (updateStatusDto.note) {
        order.note = updateStatusDto.note;
      }

      const updatedOrder = await queryRunner.manager.getRepository(Order).save(order);

      // Nếu đơn hàng chuyển sang SUCCESS và có payment COD, cập nhật payment status thành success
      if (updateStatusDto.status === OrderStatus.SUCCESS) {
        const codPayment = order.payments?.find((payment) => payment.payment_method?.toLowerCase() === 'cod');
        if (codPayment) {
          codPayment.status = 'success';
          await queryRunner.manager.getRepository(Payment).save(codPayment);
          // Tăng số lượng sản phẩm khi đơn hàng COD thành công
          await this.increaseInventoryOnSuccess(orderId);
        }
      }

      await queryRunner.commitTransaction();
      return updatedOrder;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  // Hủy đơn hàng (User) - chỉ được hủy khi trạng thái là PENDING
  async cancelOrder(orderId: number, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại`);
    }

    // Kiểm tra quyền sở hữu
    if (order.user.id !== userId) {
      throw new BadRequestException('Bạn không có quyền hủy đơn hàng này');
    }

    // Chỉ được hủy khi trạng thái là PENDING
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể hủy đơn hàng khi đang ở trạng thái chờ xử lý');
    }

    // Hoàn kho khi hủy đơn
    await this.restoreInventory(orderId);

    order.status = OrderStatus.CANCELLED;
    return this.orderRepository.save(order);
  }

  // Validate việc chuyển đổi trạng thái
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.SUCCESS],
      [OrderStatus.SUCCESS]: [], // Không thể chuyển từ SUCCESS sang trạng thái khác
      [OrderStatus.CANCELLED]: [], // Không thể chuyển từ CANCELLED sang trạng thái khác
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Không thể chuyển từ trạng thái ${currentStatus} sang ${newStatus}`);
    }
  }

  // Hoàn kho khi hủy đơn hàng
  private async restoreInventory(orderId: number): Promise<void> {
    const order = await this.orderRepository.findWithItemsAndProducts(orderId);

    for (const item of order.orderItem) {
      const product = item.product;
      if (!product) continue;

      product.quantity += item.quantity;
      await this.dataSource.getRepository(Product).save(product);
    }
  }

  // Mua lại đơn hàng (Reorder)
  async reorderOrder(orderId: number, reorderDto: ReorderDto, userId: number): Promise<Order> {
    // 1. Lấy thông tin đơn hàng cũ
    const originalOrder = await this.orderRepository.findWithItemsAndProducts(orderId);
    if (!originalOrder) {
      throw new NotFoundException(`Đơn hàng với ID ${orderId} không tồn tại`);
    }

    // 2. Kiểm tra quyền sở hữu
    if (originalOrder.user.id !== userId) {
      throw new BadRequestException('Bạn không có quyền mua lại đơn hàng này');
    }

    // 3. Kiểm tra trạng thái đơn hàng phải là SUCCESS
    if (originalOrder.status !== OrderStatus.SUCCESS) {
      throw new BadRequestException('Chỉ có thể mua lại đơn hàng đã hoàn thành');
    }

    // 4. Kiểm tra payment status phải là success
    const hasSuccessfulPayment = originalOrder.payments?.some((payment) => payment.status === 'success');
    if (!hasSuccessfulPayment) {
      throw new BadRequestException('Chỉ có thể mua lại đơn hàng đã thanh toán thành công');
    }

    // 5. Kiểm tra sản phẩm còn tồn kho
    for (const item of originalOrder.orderItem) {
      const product = item.product;
      if (!product) {
        throw new BadRequestException(`Sản phẩm trong đơn hàng cũ không tồn tại`);
      }
      if (product.quantity < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${product.name} không đủ tồn kho. Còn: ${product.quantity}, yêu cầu: ${item.quantity}`,
        );
      }
    }

    // 6. Tạo đơn hàng mới từ đơn hàng cũ
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 6.1. Tạo order mới
      const newOrder = this.orderRepository.create({
        total_price: originalOrder.total_price,
        note: reorderDto.note || `Mua lại đơn hàng ${originalOrder.order_code}`,
        order_code: this.generateOrderCode(),
        status: OrderStatus.PENDING,
      });

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException('User này không tồn tại');
      }
      newOrder.user = user;

      // 6.2. Trừ kho và tạo order items
      const preparedItems: { quantity: number; unit_price: number; product: Product }[] = [];
      for (const item of originalOrder.orderItem) {
        const product = item.product;
        if (!product) continue;

        // Trừ kho
        product.quantity -= item.quantity;
        await queryRunner.manager.getRepository(Product).save(product);

        preparedItems.push({
          quantity: item.quantity,
          unit_price: item.unit_price,
          product: product,
        });
      }

      // 6.3. Lưu order mới
      const savedOrder = await queryRunner.manager.getRepository(Order).save(newOrder as any);

      // 6.4. Tạo order items
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
      return savedOrder;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async getDailyRevenue(start_date?: string, end_date?: string): Promise<{ date: string; revenue: number }[]> {
    return this.orderRepository.getDailyRevenue(start_date, end_date);
  }

  private async increaseInventoryOnSuccess(orderId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const order = await this.orderRepository.findWithItemsAndProducts(orderId);
      for (const item of order.orderItem) {
        const product = item.product;
        if (!product) continue;
        // Tăng số lượng purchase lên 1 cho mỗi sản phẩm trong đơn hàng
        product.purchase += 1;
        await queryRunner.manager.getRepository(Product).save(product);
      }
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }
}
