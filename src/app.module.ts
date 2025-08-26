import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AddressModule } from './address/address.module';
import { AuthModule } from './auth/auth.module';
import { BrandModule } from './brand/brand.module';
import { CartModule } from './cart/cart.module';
import { CartItemModule } from './cart_item/cart_item.module';
import { CategoriesModule } from './category/categories.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DatabaseModule } from './database/database.module';
import { NewsModule } from './news/news.module';
import { OrderModule } from './order/order.module';
import { OrderItemModule } from './order_item/order_item.module';
import { ProductImagesModule } from './product-images/product-images.module';
import { ProductVariantModule } from './product-variant/product-variant.module';
import { ProductsModule } from './products/products.module';
import { RatingModule } from './rating/rating.module';
import { UsersModule } from './users/users.module';
import { PaymentModule } from './payment/payment.module';
import { VoucherModule } from './voucher/voucher.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ cache: true, isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // trỏ ra ngoài dist
      serveRoot: '/uploads',
    }),
    AuthModule,
    ProductsModule,
    CategoriesModule,
    DatabaseModule,
    ProductVariantModule,
    ProductImagesModule,
    BrandModule,
    UsersModule,
    AddressModule,
    VoucherModule,
    OrderModule,
    OrderItemModule,
    RatingModule,
    WishlistModule,
    CartModule,
    CartItemModule,
    NewsModule,
    CloudinaryModule,
    PaymentModule,
  ],
  controllers: [],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtGuard,
    // },
  ],
})
export class AppModule {}
