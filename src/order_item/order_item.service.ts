import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderItemDto } from './dto/create-order_item.dto';
import { UpdateOrderItemDto } from './dto/update-order_item.dto';
import { OrderItemRepository } from './order_item.repository';
import { OrderRepository } from '../order/order.repository';
import { ProductRepository } from '../products/products.repository';

@Injectable()
export class OrderItemService {
  constructor(
    private readonly orderItemRepository: OrderItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
  ) {}

  async create(_createOrderItemDto: CreateOrderItemDto) {
    const orderItem = await this.orderItemRepository.create(_createOrderItemDto);
    const order = await this.orderRepository.findById(_createOrderItemDto.orderId);
    if (!order) throw new NotFoundException('Đơn hàng không tồn tại');
    orderItem.order = order;
    const product = await this.productRepository.findOne(_createOrderItemDto.productId);
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    orderItem.product = product;

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

    if (_updateOrderItemDto.productId) {
      const product = await this.productRepository.findOne(_updateOrderItemDto.productId);
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
      orderItemExist.product = product;
    }

    return this.orderItemRepository.save(orderItemExist);
  }

  remove(id: number) {
    return `This action removes a #${id} orderItem`;
  }

  async findAllOrderItemByProductId(productId: number) {
    return await this.orderItemRepository.findAllOrderItemByProductId(productId);
  }
}
