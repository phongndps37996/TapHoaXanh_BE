import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../database/database.entity';
import { Order } from '../../order/entities/order.entity';
import { ProductVariant } from '../../product-variant/entities/product-variant.entity';

@Entity('order_item')
export class OrderItem extends AbstractEntity<OrderItem> {
  @Column()
  quantity!: number;

  @Column()
  unit_price!: number;

  @ManyToOne(() => Order, (order) => order.orderItem)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => ProductVariant, (productVariant) => productVariant.orderItem)
  @JoinColumn({ name: 'productVariant_id' })
  productVariant!: ProductVariant;
}
