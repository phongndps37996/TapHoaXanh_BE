import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderItemDto } from './dto/create-order_item.dto';
import { UpdateOrderItemDto } from './dto/update-order_item.dto';
import { OrderItemRepository } from './order_item.repository';
import { OrderRepository } from '../order/order.repository';
import { ProductVariantRepository } from '../product-variant/product-variant.repository';

@Injectable()
export class OrderItemService {
  constructor(
    private readonly orderItemRepository: OrderItemRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly orderRepository: OrderRepository,
  ) {}

  async create(_createOrderItemDto: CreateOrderItemDto) {
    const orderItem = await this.orderItemRepository.create(_createOrderItemDto);
    const order = await this.orderRepository.findById(_createOrderItemDto.orderId);
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    orderItem.order = order;
    const productVariant = await this.productVariantRepository.findById(_createOrderItemDto.productVariantId);
    if (!productVariant) throw new NotFoundException('Biến thể không tồn tại');
    orderItem.productVariant = productVariant;

    return this.orderItemRepository.save(orderItem);
  }

  findAll() {
    return `This action returns all orderItem`;
  }

  async findOne(id: number) {
    return await this.orderItemRepository.findById(id);
  }

  async update(id: number, _updateOrderItemDto: UpdateOrderItemDto) {
    const orderItemExist = await this.findOne(id);
    if (!orderItemExist) throw new NotFoundException('Đơn hàng không tồn tại');
    if (_updateOrderItemDto.orderId) {
      const order = await this.orderRepository.findById(_updateOrderItemDto.orderId);
      if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
      orderItemExist.order = order;
    }

    if (_updateOrderItemDto.productVariantId) {
      const productVariant = await this.productVariantRepository.findById(_updateOrderItemDto.productVariantId);
      if (!productVariant) throw new NotFoundException('Biến thể không tồn tại');
      orderItemExist.productVariant = productVariant;
    }

    return this.orderItemRepository.save(orderItemExist);
  }

  remove(id: number) {
    return `This action removes a #${id} orderItem`;
  }
}
