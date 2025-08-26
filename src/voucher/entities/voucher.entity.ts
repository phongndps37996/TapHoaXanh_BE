import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../database/database.entity';
import { Order } from '../../order/entities/order.entity';
import { VoucherType } from '../enums/voucher-type.enum';

@Entity('voucher')
export class Voucher extends AbstractEntity<Voucher> {
  @Column()
  code!: string;

  @Column()
  max_discount!: number;

  @Column()
  min_order_value!: number;

  @Column()
  quantity!: number;

  @Column()
  is_used!: boolean;

  @Column()
  start_date!: Date;

  @Column()
  end_date!: Date;

  @Column({ type: 'enum', enum: VoucherType, nullable: true })
  type?: VoucherType;

  @Column({ nullable: true })
  value!: number;

  @ManyToOne(() => Order, (order) => order.voucher)
  @JoinColumn({ name: 'order_id' })
  order?: Order;
}
