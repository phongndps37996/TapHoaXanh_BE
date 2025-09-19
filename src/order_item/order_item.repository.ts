import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../database/abstract.repository';
import { OrderItem } from './entities/order_item.entity';

export class OrderItemRepository extends BaseRepository<OrderItem> {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {
    super(orderItemRepository);
  }
  async findAllOrderItemByProductId(productId: number): Promise<OrderItem[]> {
    return await this.orderItemRepository.find({
      where: { product: { id: productId } },
    });
  }
}
