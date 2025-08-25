import { Payment } from '../../payment/entities/payment.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../database/database.entity';
import { OrderItem } from '../../order_item/entities/order_item.entity';
import { Users } from '../../users/entities/users.entity';
import { Voucher } from '../../voucher/entities/voucher.entity';

@Entity('order')
export class Order extends AbstractEntity<Order> {
  @Column()
  total_price!: number;

  @Column()
  note?: string;

  @Column({ unique: true })
  order_code!: string;

  @Column()
  status!: string;

  @ManyToOne(() => Users, (user) => user.order)
  user!: Users;

  @OneToMany(() => Voucher, (voucher) => voucher.order)
  voucher?: Voucher[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItem!: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments!: Payment[];
}
