import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { WishListRepository } from './wishlist.repository';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist]), AuthModule, JwtModule, UsersModule, ProductsModule],
  controllers: [WishlistController],
  providers: [WishlistService, WishListRepository],
  exports: [WishlistService, WishListRepository],
})
export class WishlistModule {}
