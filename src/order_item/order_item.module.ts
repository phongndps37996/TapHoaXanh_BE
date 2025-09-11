import { Module, forwardRef } from '@nestjs/common';
import { OrderItemService } from './order_item.service';
import { OrderItemController } from './order_item.controller';
import { OrderItem } from './entities/order_item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItemRepository } from './order_item.repository';
import { ProductsModule } from '../products/products.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { OrderRepository } from '../order/order.repository';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem, Order]), forwardRef(() => ProductsModule), JwtModule, AuthModule],
  controllers: [OrderItemController],
  providers: [OrderItemService, OrderItemRepository, OrderRepository],
  exports: [OrderItemService, OrderItemRepository],
})
export class OrderItemModule {}
