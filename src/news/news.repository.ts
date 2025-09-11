import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../database/abstract.repository';
import { QueryNewsDto } from './dto/query-news.dto';
import { News } from './entities/news.entity';

@Injectable()
export class NewsRepository extends BaseRepository<News> {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
  ) {
    super(newsRepository);
  }

  async findAllWithRelations(): Promise<News[]> {
    return this.newsRepository.find({
      relations: ['author', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneWithRelations(id: number): Promise<News | null> {
    return this.newsRepository.findOne({
      where: { id },
      relations: ['author', 'category'],
    });
  }

  async findWithPagination(query: QueryNewsDto) {
    const { search, page = 1, limit = 10 } = query;
    const qb = this.newsRepository.createQueryBuilder('news');

    if (search) {
      qb.andWhere('(news.name LIKE :search OR news.description LIKE :search)', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('news.id', 'DESC')
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

  async incrementViews(id: number): Promise<void> {
    await this.newsRepository.increment({ id }, 'views', 1);
  }

  async incrementLikes(id: number): Promise<void> {
    await this.newsRepository.increment({ id }, 'likes', 1);
  }

  async decrementLikes(id: number): Promise<void> {
    await this.newsRepository.decrement({ id }, 'likes', 1);
  }

  async findByType(type: string): Promise<News[]> {
    return this.newsRepository.find({
      where: { type },
      relations: ['author', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPopular(limit: number = 10): Promise<News[]> {
    return this.newsRepository.find({
      relations: ['author', 'category'],
      order: { views: 'DESC', likes: 'DESC' },
      take: limit,
    });
  }

  async findRecent(limit: number = 10): Promise<News[]> {
    return this.newsRepository.find({
      relations: ['author', 'category'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
