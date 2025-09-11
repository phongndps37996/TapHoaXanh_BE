import { forwardRef, Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartRepositoryProvider, CartServiceProvider } from './cart.provider';
import { CartItemModule } from '../cart_item/cart_item.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cart]), forwardRef(() => CartItemModule), JwtModule, UsersModule, AuthModule],
  controllers: [CartController],
  providers: [CartRepositoryProvider, CartServiceProvider],
  exports: [CartRepositoryProvider, CartServiceProvider],
})
export class CartModule {}
