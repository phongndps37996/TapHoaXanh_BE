import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Brand } from '../../brand/entities/brand.entity';
import { Category } from '../../category/entities/category.entity';
import { AbstractEntity } from '../../database/database.entity';
import { CartItem } from '../../cart_item/entities/cart_item.entity';
import { ProductImage } from '../../product-images/entities/product-image.entity';
import { Rating } from '../../rating/entities/rating.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
import { OrderItem } from '../../order_item/entities/order_item.entity';

@Entity('product')
export class Product extends AbstractEntity<Product> {
  @Column()
  name!: string;

  @Column()
  price!: number;

  @Column({ default: 0 })
  quantity!: number;

  @Column()
  discount!: number;

  @Column()
  images!: string;

  @Column()
  slug!: string;

  @Column({ unique: true })
  barcode!: string;

  @Column()
  expiry_date!: Date;

  @Column()
  origin!: string;

  @Column()
  weight_unit!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 0 })
  purchase!: number;

  @ManyToOne(() => Category, (category) => category.product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @OneToMany(() => ProductImage, (image) => image.product)
  image!: ProductImage;

  @ManyToOne(() => Brand, (brand) => brand.product)
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;

  @OneToMany(() => Rating, (rating) => rating.product)
  rating!: Rating[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.product)
  wishlist!: Wishlist[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems!: CartItem[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems!: OrderItem[];
}
