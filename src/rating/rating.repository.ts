import { BaseRepository } from 'src/database/abstract.repository';
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
    const qb = this.ratingRepository.createQueryBuilder('rating');

    qb.orderBy('rating.rating', 'DESC')
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
