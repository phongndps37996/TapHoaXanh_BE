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
    const { search, brand, category, minPrice, maxPrice, page = 1, limit = 10 } = query;
    const qb = this.productRepository.createQueryBuilder('product');

    if (search) {
      qb.andWhere('(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.barcode) LIKE LOWER(:search))', {
        search: `%${search}%`,
      });
    }

    if (brand) {
      qb.leftJoin('product.brand', 'brand');
      qb.andWhere('LOWER(brand.name) LIKE LOWER(:brand)', { brand });
    }

    if (category) {
      qb.andWhere('product.category = :category', { category });
    }

    if (minPrice) {
      qb.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    qb.orderBy('product.id', 'DESC')
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

  async getLatestProducts(): Promise<Product[]> {
    return this.productRepository.createQueryBuilder('product').orderBy('product.id', 'DESC').limit(10).getMany();
  }

  async getDetailProduct(slug: string) {
    return await this.productRepository
      .createQueryBuilder('p')
      .innerJoin('p.variants', 'pv') // quan hệ Product -> ProductVariant
      .leftJoin('p.image', 'pi2') // quan hệ Product -> ProductImage
      .select([
        'pv.variant_name AS variant_name',
        'pv.image_url AS variant_image',
        'p.description AS description',
        'pi2.image_url AS product_image',
        'pv.price_modifier AS price_modifier',
      ])
      .where('p.slug LIKE :slug', { slug: `%${slug}%` })
      .getRawMany();
  }

  async getTopPurchased(limit: number): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .orderBy('product.purchase', 'DESC')
      .limit(limit)
      .getMany();
  }
}
