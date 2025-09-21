import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from 'src/database/abstract.repository';
import { Repository } from 'typeorm';
import { FilterWishListDto } from './dto/filter-wishlist.dto';
import { Wishlist } from './entities/wishlist.entity';

export class WishListRepository extends BaseRepository<Wishlist> {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishListRepository: Repository<Wishlist>,
  ) {
    super(wishListRepository);
  }

  async filterWishList(userId: number, query: FilterWishListDto) {
    const { page = 1, limit = 10 } = query;

    const qb = this.wishListRepository
      .createQueryBuilder('wishlist')
      .innerJoin('wishlist.users', 'u')
      .innerJoinAndSelect('wishlist.product', 'product')
      .where('u.id = :userId', { userId })
      .orderBy('wishlist.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
