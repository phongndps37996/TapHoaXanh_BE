import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ICloudinaryService } from '../cloudinary/interfaces/icloudinary-service.interface';
import { BrandRepository } from '../brand/brand.repsitory';
import { CategoryRepository } from '../category/categories.reposirory';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductFilterDto } from './dto/Filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductRepository } from './products.repository';
@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async create(createProductDto: CreateProductDto, image: Express.Multer.File) {
    const product = this.productRepository.create(createProductDto);
    const existProductByCode = await this.productRepository.findOneByField('barcode', createProductDto.barcode);
    if (existProductByCode) throw new BadRequestException('Mã code này đã được sử dụng');

    const existCategory = await this.categoryRepository.findById(createProductDto.categoryId);
    if (!existCategory) throw new NotFoundException('Danh mục này không tồn tại');
    product.category = existCategory;

    const existBrand = await this.brandRepository.findById(createProductDto.brandId);
    if (!existBrand) throw new NotFoundException('Thương hiệu này không tồn tại');
    product.brand = existBrand;

    const cloudinaryResult = await this.cloudinaryService.uploadFile(image, {
      fileType: 'product',
    });

    if (!cloudinaryResult) {
      throw new InternalServerErrorException('Upload ảnh thất bại');
    }
    product.images = cloudinaryResult.secure_url;

    return await this.productRepository.save(product);
  }

  async findAll() {
    return await this.productRepository.findAll();
  }

  async getLatestProducts() {
    return await this.productRepository.getLatestProducts();
  }
  // show sp theo danh muc
  async findByCategory(categoryId: number) {
    const existCategory = await this.categoryRepository.findById(categoryId);
    if (!existCategory) throw new NotFoundException('Danh mục không tồn tại');
    return await this.productRepository.findByCategory(categoryId);
  }

  // show sp theo id
  async productDetail(id: number) {
    const existProduct = await this.productRepository.findOne(id);
    if (!existProduct) throw new NotFoundException('Sản phẩm không tồn tại');
    return existProduct;
  }

  async update(id: number, updateProductDto: UpdateProductDto, file?: Express.Multer.File) {
    const existProduct = await this.productRepository.findById(id);
    if (!existProduct) throw new NotFoundException('Sản phẩm không tồn tại');

    if (updateProductDto.barcode) {
      const idProduct = await this.productRepository.findOneByField('barcode', updateProductDto.barcode);
      if (idProduct && idProduct.id !== id) throw new BadRequestException('Mã code này đã được sử dụng');
    }

    if (file) {
      if (existProduct.images) this.cloudinaryService.deleteFile(existProduct.images);
      const uploaded = await this.cloudinaryService.uploadFile(file, {
        fileType: 'product',
      });
      updateProductDto.images = uploaded.secure_url;
    }

    const updateProduct = this.productRepository.create({
      ...existProduct,
      ...updateProductDto,
    });

    await this.productRepository.save(updateProduct);

    return {
      message: 'Cập nhật thành công',
      data_update: updateProduct,
    };
  }

  async remove(id: number) {
    const existProduct = await this.productRepository.findById(id);
    if (!existProduct) throw new NotFoundException('Sản phẩm không tồn tại');

    this.cloudinaryService.deleteFile(existProduct.images);

    await this.productRepository.delete(id);

    return { message: 'Xóa thành công' };
  }

  async removeByCategoryId(id: number) {
    const existProduct = await this.productRepository.findByCategory(id);
    if (!existProduct) throw new NotFoundException('Sản phẩm không tồn tại');

    existProduct.map((item) => this.cloudinaryService.deleteFile(item.images));

    await this.productRepository.deleteByCategoryId(id);

    return { message: 'Xóa thành công' };
  }

  async restore(id: number) {
    await this.productRepository.update(id, { deletedAt: null });
    return { message: 'Khôi phục thành công' };
  }
  async filterProducts(query: ProductFilterDto) {
    return this.productRepository.filterProducts(query);
  }

  async getDetailProduct(slug: string) {
    return await this.productRepository.getDetailProduct(slug);
  }

  async getTopPurchasedProducts(limit: number) {
    return this.productRepository.getTopPurchased(limit);
  }
}
