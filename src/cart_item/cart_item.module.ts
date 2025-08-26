import { forwardRef, Module } from '@nestjs/common';
import CartItemController from './cart_item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItem } from './entities/cart_item.entity';
import { CartItemRepositoryProvider, CartItemServiceProvider } from './cart_item.provider';
import { CartModule } from '../cart/cart.module';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ProductVariantModule } from '../product-variant/product-variant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem]),
    forwardRef(() => CartModule),
    forwardRef(() => ProductsModule),
    AuthModule,
    JwtModule,
    forwardRef(() => ProductVariantModule),
  ],
  controllers: [CartItemController],
  providers: [CartItemRepositoryProvider, CartItemServiceProvider],
  exports: [CartItemRepositoryProvider, CartItemServiceProvider],
})
export class CartItemModule {}
