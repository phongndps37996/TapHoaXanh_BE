import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Brand } from '../../brand/entities/brand.entity';
import { Category } from '../../category/entities/category.entity';
import { AbstractEntity } from '../../database/database.entity';
import { ProductImage } from '../../product-images/entities/product-image.entity';
import { ProductVariant } from '../../product-variant/entities/product-variant.entity';
import { Rating } from '../../rating/entities/rating.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';

@Entity('product')
export class Product extends AbstractEntity<Product> {
  @Column()
  name!: string;

  @Column()
  price!: number;

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

  @ManyToOne(() => Category, (category) => category.product)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants!: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product)
  image!: ProductImage;

  @ManyToOne(() => Brand, (brand) => brand.product)
  @JoinColumn({ name: 'brand_id' })
  brand!: Brand;

  @OneToMany(() => Rating, (rating) => rating.product)
  rating!: Rating[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.product)
  wishlist!: Wishlist[];
}
