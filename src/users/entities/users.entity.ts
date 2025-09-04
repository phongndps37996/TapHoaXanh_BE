import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { Address } from '../../address/entities/address.entity';
import { Token } from '../../auth/entities/token.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { AbstractEntity } from '../../database/database.entity';
import { Order } from '../../order/entities/order.entity';
import { Rating } from '../../rating/entities/rating.entity';
import { TUserRole } from '../../types/common.enum';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
@Entity('users')
export class Users extends AbstractEntity<Users> {
  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 20, nullable: true })
  phone?: string;

  @Column('varchar', { length: 255, nullable: true })
  image?: string;

  @Column({ type: 'enum', enum: TUserRole, default: TUserRole.USER })
  role!: TUserRole;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column('varchar', { length: 255, unique: true })
  email!: string;

  @Column('varchar', { length: 255 })
  password!: string;

  @OneToMany(() => Address, (address) => address.users)
  address?: Address[];

  @OneToMany(() => Order, (order) => order.user)
  order?: Order[];
  @OneToMany(() => Rating, (rating) => rating.users)
  rating?: Rating[];
  @OneToMany(() => Wishlist, (wishlist) => wishlist.users)
  wishlist?: Wishlist[];
  @OneToMany(() => Cart, (cart) => cart.user)
  cart?: Cart[];
  @OneToOne(() => Token, (token) => token.user, { nullable: true })
  @JoinColumn({ name: 'token_id' })
  token?: Token;
}
