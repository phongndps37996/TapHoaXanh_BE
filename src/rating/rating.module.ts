import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { RatingRepository } from './rating.repository';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';
import { AuthModule } from 'src/auth/auth.module';
import { IsAdminGuard } from 'src/auth/guards/IsAdmin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Rating]), UsersModule, ProductsModule, AuthModule],
  controllers: [RatingController],
  providers: [RatingService, RatingRepository, IsAdminGuard],
})
export class RatingModule {}
