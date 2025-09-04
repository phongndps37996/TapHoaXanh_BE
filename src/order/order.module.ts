import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { UsersModule } from '../users/users.module';
import { OrderRepository } from './order.repository';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { CartItemModule } from '../cart_item/cart_item.module';
import { OrderItemModule } from '../order_item/order_item.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), UsersModule, JwtModule, AuthModule, CartItemModule, OrderItemModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
