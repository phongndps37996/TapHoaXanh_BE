import { AbstractEntity } from '../../database/database.entity';
import { Users } from '../../users/entities/users.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Order } from '../../order/entities/order.entity';

@Entity('address')
export class Address extends AbstractEntity<Address> {
  @Column()
  street?: string;

  @Column()
  city?: string;

  @Column()
  district?: string;

  @Column()
  is_default?: boolean;

  @ManyToOne(() => Users, (users) => users.address)
  @JoinColumn({ name: 'user_id' })
  users!: Users;

  @OneToMany(() => Order, (order) => order.address)
  orders?: Order[];
}
