import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../database/abstract.repository';
import { Repository } from 'typeorm';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryRepository extends BaseRepository<Category> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
    super(categoryRepository);
  }

  // Tìm kiếm category theo tên
  async findByName(name: string): Promise<Category | null> {
    return this.categoryRepository.findOne({ where: { name } });
  }

  async filterCategories(query: FilterCategoryDto) {
    const { search, parentId, page = 1, limit = 10 } = query;
    const offset = (page - 1) * limit;

    // --- Query đếm tổng ---
    const totalQb = this.categoryRepository
      .createQueryBuilder('child')
      .leftJoin(Category, 'parent', 'child.parent_id = parent.id');

    if (search) {
      totalQb.andWhere('LOWER(child.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (parentId) {
      totalQb.andWhere('child.parent_id = :parentId', { parentId });
    }

    const totalResult = await totalQb.select('COUNT(DISTINCT child.id)', 'count').getRawOne();
    const total = parseInt(totalResult.count, 10);

    // --- Query lấy data phân trang ---
    const dataQb = this.categoryRepository
      .createQueryBuilder('child')
      .leftJoin(Category, 'parent', 'child.parent_id = parent.id')
      .select(['child.id AS child_id', 'child.name AS child_name', 'parent.name AS parent_name', 'child.image_url']);

    if (search) {
      dataQb.andWhere('LOWER(child.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (parentId) {
      dataQb.andWhere('child.parent_id = :parentId', { parentId });
    }

    dataQb.orderBy('child.id', 'DESC').limit(limit).offset(offset);

    // --- Lấy data ---
    const data = await dataQb.getRawMany();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async deleteCategoryWithParentId(condition: Pick<Category, 'parent_id'>) {
    return await this.categoryRepository.delete(condition);
  }
}
