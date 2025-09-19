import { BaseRepository } from '../database/abstract.repository';
import { Rating } from './entities/rating.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { RatingFilterDto } from './dto/Filter-rating.dto';

@Injectable()
export class RatingRepository extends BaseRepository<Rating> {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {
    super(ratingRepository);
  }

  async filterRating(query: RatingFilterDto) {
    const { page = 1, limit = 10 } = query;

    const qb = this.ratingRepository
      .createQueryBuilder('rating')
      .leftJoin('rating.product', 'product')
      .leftJoin('rating.users', 'user')
      .select([
        'rating.id',
        'rating.comment',
        'rating.rating', // rating value
        'product.name', // product name
        'user.name', // user name
      ])
      .orderBy('rating.rating', 'DESC')
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

  async deletedRatingByProductId(productId: number) {
    return await this.ratingRepository.delete({ product: { id: productId } });
  }

  async findAllRatingByProductId(productId: number): Promise<Rating[]> {
    return await this.ratingRepository.find({
      where: { product: { id: Number(productId) } }, // 👈 ép sang number
    });
  }

  async getAllRatingsByProductId(productId: number): Promise<Rating[]> {
    return await this.ratingRepository
      .createQueryBuilder('r')
      .select([
        'r.id AS ratingId',
        'r.rating AS rating',
        'u.name AS userName',
        'p.name AS productName',
        'p.id AS productId',
        'r.comment AS comment',
        'r.createdAt AS createdAt',
      ])
      .innerJoin('r.product', 'p')
      .innerJoin('r.users', 'u')
      .where('p.id = :productId', { productId })
      .getRawMany();
  }
}
