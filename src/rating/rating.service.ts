import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUsersRepository } from '../users/interfaces/iusers-repository.interface';
import { RatingRepository } from './rating.repository';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from './entities/rating.entity';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { ProductRepository } from '../products/products.repository';
import { RatingFilterDto } from './dto/Filter-rating.dto';

@Injectable()
export class RatingService {
  constructor(
    private readonly ratingRepository: RatingRepository,
    @Inject(IUsersRepository) private readonly userRepository: IUsersRepository, // ✅ đúng token
    private readonly productRepository: ProductRepository,
  ) {}

  async create(createRatingDto: CreateRatingDto): Promise<Rating> {
    const rating = this.ratingRepository.create(createRatingDto);
    if (createRatingDto.user_id) {
      const existUser = await this.userRepository.findById(createRatingDto.user_id);
      if (!existUser) throw new NotFoundException('Người dùng này không tồn tại');
      rating.users = existUser;
    }
    if (createRatingDto.product_id) {
      const existProduct = await this.productRepository.findById(createRatingDto.product_id);
      if (!existProduct) throw new NotFoundException('Sản phẩm này không tồn tại');
      rating.product = existProduct;
    }
    return await this.ratingRepository.save(rating);
  }

  findAll() {
    return `This action returns all rating`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rating`;
  }

  async update(id: number, updateRatingDto: UpdateRatingDto) {
    const rating = await this.ratingRepository.findById(id);
    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }
    const newRating = this.ratingRepository.create({
      ...rating,
      ...updateRatingDto,
    });
    if (updateRatingDto.user_id) {
      const existUser = await this.userRepository.findById(updateRatingDto.user_id);
      if (!existUser) throw new NotFoundException('Người dùng này không tồn tại');
      newRating.users = existUser;
    }
    if (updateRatingDto.product_id) {
      const existProduct = await this.productRepository.findById(updateRatingDto.product_id);
      if (!existProduct) throw new NotFoundException('Sản phẩm này không tồn tại');
      newRating.product = existProduct;
    }
    return await this.ratingRepository.save(newRating);
  }

  async remove(id: number) {
    const existRating = await this.ratingRepository.findById(id);
    if (!existRating) throw new NotFoundException('Đánh giá không tồn tại');

    await this.ratingRepository.delete(id);

    return { message: 'Xóa thành công' };
  }

  async filterRating(query: RatingFilterDto) {
    return await this.ratingRepository.filterRating(query);
  }

  async deletedRatingByProductId(product_id: number) {
    const rating = await this.ratingRepository.findAllRatingByProductId(product_id);
    console.log('🚀 ~ RatingService ~ deletedRatingByProductId ~ rating:', rating);
    if (rating.length === 0) {
      throw new NotFoundException(`Rating with ID ${product_id} not found`);
    }
    await this.ratingRepository.deletedRatingByProductId(product_id);
    return { message: 'Xóa thành công' };
  }

  async getAllRatingsByProductId(productId: number): Promise<Rating[]> {
    return await this.ratingRepository.getAllRatingsByProductId(productId);
  }
}
