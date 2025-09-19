import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { CategoriesModule } from '../category/categories.module';
import { BrandModule } from '../brand/brand.module';
import { ProductRepository } from './products.repository';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { IsAdminGuard } from '../auth/guards/IsAdmin.guard';
import { AuthModule } from '../auth/auth.module';
import { OrderItemModule } from 'src/order_item/order_item.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    forwardRef(() => CategoriesModule),
    BrandModule,
    CloudinaryModule,
    AuthModule,
    OrderItemModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductRepository, IsAdminGuard],
  exports: [ProductsService, ProductRepository],
})
export class ProductsModule {}
