import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../database/abstract.repository';
import { OrderItem } from './entities/order_item.entity';
import { Repository } from 'typeorm';

export class OrderItemRepository extends BaseRepository<OrderItem> {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {
    super(orderItemRepository);
  }
}
