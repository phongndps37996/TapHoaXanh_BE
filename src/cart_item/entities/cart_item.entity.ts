import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../product-variant/entities/product-variant.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Cart } from '../../cart/entities/cart.entity';
import { AbstractEntity } from '../../database/database.entity';

@Entity('cart_item')
export class CartItem extends AbstractEntity<CartItem> {
  constructor(cart: Cart, quantity: number, price: number, product?: Product, product_variant?: ProductVariant) {
    super();
    this.cart = cart;
    this.quantity = quantity;
    this.price = price;
    this.product = product;
    this.product_variant = product_variant;
  }
  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column()
  total_price?: number;

  @Column()
  price!: number;

  @ManyToOne(() => Product, (product) => product.cartItems, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ManyToOne(() => ProductVariant, (product_variant) => product_variant.cartItems, { nullable: true })
  @JoinColumn({ name: 'product_variant_id' })
  product_variant?: ProductVariant;

  @ManyToOne(() => Cart, (cart) => cart.cartItems)
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;
}
