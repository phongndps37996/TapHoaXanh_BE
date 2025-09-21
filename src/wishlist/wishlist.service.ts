import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from 'src/products/products.repository';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { WishListRepository } from './wishlist.repository';
import { FilterWishListDto } from './dto/filter-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    private readonly wishListRepository: WishListRepository,
    private readonly productRepository: ProductRepository,
  ) {}
  async create(userId: number, _createWishlistDto: CreateWishlistDto) {
    if (!_createWishlistDto.productId) return;
    const productExist = this.productRepository.findById(_createWishlistDto.productId);
    if (!productExist) throw new NotFoundException('Sản phẩm không tồn tại');
    const newWishlist = this.wishListRepository.create({
      users: { id: userId },
      product: { id: _createWishlistDto.productId },
    });
    return await this.wishListRepository.save(newWishlist);
  }
  async filterWishList(userId: number, query: FilterWishListDto) {
    return await this.wishListRepository.filterWishList(userId, query);
  }

  findOne(id: number) {
    return `This action returns a #${id} wishlist`;
  }

  update(id: number, _updateWishlistDto: UpdateWishlistDto) {
    return `This action updates a #${id} wishlist`;
  }

  async remove(id: number) {
    const wishlist = this.wishListRepository.findById(id);
    if (!wishlist) throw new NotFoundException(`Wishlist with ID ${id} not found`);
    await this.wishListRepository.delete(id);
    return { message: 'Xóa thành công' };
  }
}
