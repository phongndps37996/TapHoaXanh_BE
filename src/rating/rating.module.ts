import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { RatingRepository } from './rating.repository';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';
import { IsAdminGuard } from '../auth/guards/IsAdmin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Rating]), UsersModule, ProductsModule, AuthModule],
  controllers: [RatingController],
  providers: [RatingService, RatingRepository, IsAdminGuard],
})
export class RatingModule {}
