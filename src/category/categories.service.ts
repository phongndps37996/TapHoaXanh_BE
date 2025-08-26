import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './categories.reposirory';
import { CreateCategoryDto } from './dto/create-category.dto';
import { FilterCategoryDto } from './dto/filter-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ICloudinaryService } from '../cloudinary/interfaces/icloudinary-service.interface';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, image: Express.Multer.File) {
    console.log(11111);

    // Kiểm tra category đã tồn tại (giả sử kiểm tra theo tên)
    const category = this.categoryRepository.create(createCategoryDto);
    const existCategory = await this.categoryRepository.findByName(createCategoryDto.name);
    if (existCategory) {
      throw new BadRequestException('Tên danh mục đã tồn tại');
    }
    if (!createCategoryDto.parent_id) {
      createCategoryDto.parent_id = 0;
    }

    // Sửa: Sử dụng uploadFile thay vì uploadMultipleFiles vì chỉ có 1 file
    const cloudinaryResult = await this.cloudinaryService.uploadFile(image, {
      fileType: `category`,
    });

    if (!cloudinaryResult) {
      throw new InternalServerErrorException('Upload ảnh thất bại');
    }
    category.image_url = cloudinaryResult.secure_url;
    return await this.categoryRepository.save(category);
  }

  async findAll() {
    return await this.categoryRepository.findAll();
  }

  async getCategoriesWithPagination(filter: FilterCategoryDto) {
    return await this.categoryRepository.filterCategories(filter);
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto, file?: Express.Multer.File) {
    // Kiểm tra danh mục tồn tại
    const existCategory = await this.categoryRepository.findById(id);
    if (!existCategory) throw new NotFoundException('Danh mục không tồn tại');

    // Kiểm tra tên mới đã tồn tại ở category khác chưa (nếu sửa tên)
    if (updateCategoryDto.name) {
      const categoryByName = await this.categoryRepository.findByName(updateCategoryDto.name);
      if (categoryByName && categoryByName.id !== id) {
        throw new BadRequestException('Tên danh mục đã tồn tại');
      }
    }

    if (file) {
      if (existCategory.image_url) this.cloudinaryService.deleteFile(existCategory.image_url);
      const uploaded = await this.cloudinaryService.uploadFile(file, {
        fileType: 'category',
      });
      existCategory.image_url = uploaded.secure_url;
    }
    // Cập nhật
    const updateCategory = this.categoryRepository.create({
      ...existCategory,
      ...updateCategoryDto,
    });
    //lưu
    const savedCategory = await this.categoryRepository.save(updateCategory);

    return {
      message: 'Cập nhật thành công',
      data_update: savedCategory,
    };
  }

  async remove(id: number) {
    // kiểm tra tồn tại trước khi xóa
    const existCategory = await this.categoryRepository.findById(id);
    if (!existCategory) throw new NotFoundException('Danh mục không tồn tại');
    this.cloudinaryService.deleteFile(existCategory.image_url);
    await this.categoryRepository.deleteCategoryWithParentId({ parent_id: id });
    await this.categoryRepository.delete(id);
    return { message: 'Xóa thành công' };
  }

  async restore(id: number) {
    await this.categoryRepository.update(id, { deletedAt: null });
    return { message: 'Khôi phục thành công' };
  }
}
