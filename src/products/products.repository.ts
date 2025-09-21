import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../database/abstract.repository';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ProductFilterDto } from './dto/Filter-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductRepository extends BaseRepository<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    super(productRepository);
  }
  async findByCode(barcode: string) {
    return this.productRepository.findOne({ where: { barcode } as FindOptionsWhere<Product> });
  }

  async findByCategory(categoryId: number) {
    return this.productRepository.find({
      where: { category: { id: categoryId } } as FindOptionsWhere<Product>,
    });
  }
  async findOne(id: number): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ['category', 'brand'],
    });
  }

  async deleteByCategoryId(id: number) {
    return await this.productRepository.delete({ category: { id } });
  }
  async filterProducts(query: ProductFilterDto) {
    const { search, brand, category, minPrice, maxPrice, page = 1, limit = 12 } = query;
    const qb = this.productRepository.createQueryBuilder('product');

    if (search) {
      qb.andWhere('(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.barcode) LIKE LOWER(:search))', {
        search: `%${search}%`,
      });
    }

    if (brand) {
      qb.andWhere('product.brand = :brand', { brand });
    }

    if (category !== undefined) {
      if (category === null) {
        qb.andWhere('product.category_id IS NULL');
      } else {
        qb.andWhere('product.category = :category', { category });
      }
    }

    if (minPrice) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    qb.orderBy('product.purchase', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    const categoryCounts = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('COUNT(product.id)', 'count')
      .groupBy('category.id, category.name')
      .getRawMany();

    return {
      data: items,
      meta: {
        total,
        categoryCounts,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async getLatestProducts(): Promise<Product[]> {
    return this.productRepository.createQueryBuilder('product').orderBy('product.id', 'DESC').limit(10).getMany();
  }

  async getDetailProduct(slug: string) {
    return await this.productRepository
      .createQueryBuilder('p')
      .leftJoin('p.image', 'pi') // quan hệ Product -> ProductImage
      .leftJoin('p.category', 'c') // quan hệ Product -> Category
      .leftJoin('p.brand', 'b') // quan hệ Product -> Brand
      .select(['p.*', 'c.name AS category_name', 'b.name AS brand_name', 'pi.image_url AS product_image'])
      .where('p.slug = :slug', { slug: slug })
      .getRawOne();
  }

  async getTopPurchased(limit: number): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .orderBy('product.purchase', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getAllProductByCateId(idCate: number): Promise<Product[]> {
    return await this.productRepository.find({
      where: {
        category: {
          id: idCate,
        },
      },
      relations: ['category'],
    });
  }

  // Nếu cate bị xóa việc đầu tiên là các product của cate đó đc lấy ra
  // sau đó cập nhật là null
  // cate sẽ đc xóa

  async getAllProductNullCate(): Promise<Product[]> {
    return await this.productRepository.createQueryBuilder('product').where('product.categoryId IS NULL').getMany();
  }

  async getProductWithRatingByOrder(orderId: number) {
    return await this.productRepository
      .createQueryBuilder('p')
      .select([
        'p.id AS productId',
        'p.name AS productName',
        'oi.order_id AS orderId',
        'r.comment AS comment',
        'r.rating AS rating',
      ])
      .innerJoin('p.orderItems', 'oi')
      .innerJoin('oi.order', 'o')
      .leftJoin('p.rating', 'r', 'r.user_id = o.userId AND r.createdAt >= o.createdAt')
      .where('oi.order_id = :orderId', { orderId })
      .getRawMany();
  }
}
