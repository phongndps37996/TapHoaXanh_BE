import { forwardRef, Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './categories.reposirory';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ProductsModule } from '../products/products.module';
import { IsAdminGuard } from '../auth/guards/IsAdmin.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), CloudinaryModule, forwardRef(() => ProductsModule), AuthModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoryRepository, IsAdminGuard],
  exports: [CategoryRepository],
})
export class CategoriesModule {}
