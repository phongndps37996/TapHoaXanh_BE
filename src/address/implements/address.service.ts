import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAddressService } from '../interfaces/iaddress-service.interface';
import { IAddressRepository } from '../interfaces/iaddress-repository.interface';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { Address } from '../entities/address.entity';

@Injectable()
export class AddressService implements IAddressService {
  constructor(
    @Inject(IAddressRepository)
    private readonly addressRepository: IAddressRepository,
  ) {}

  async create(createAddressDto: CreateAddressDto, userId: number): Promise<Address> {
    try {
      // Kiểm tra xem người dùng đã có địa chỉ nào chưa
      const existingAddresses = await this.addressRepository.findByUserId(userId);

      // Nếu người dùng chưa có địa chỉ nào, tự động đặt địa chỉ đầu tiên làm mặc định
      if (existingAddresses.length === 0) {
        const addressData = {
          ...createAddressDto,
          is_default: true,
        };
        return await this.addressRepository.create(addressData, userId);
      }

      // Nếu người dùng đã có địa chỉ và địa chỉ mới được đặt làm mặc định, bỏ mặc định của các địa chỉ khác
      if (createAddressDto.is_default) {
        await this.addressRepository.removeDefaultFromUser(userId);
      }

      return await this.addressRepository.create(createAddressDto, userId);
    } catch (error) {
      throw new BadRequestException(
        `Tạo địa chỉ thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      );
    }
  }

  async findAll(): Promise<Address[]> {
    try {
      return await this.addressRepository.findAll();
    } catch (error) {
      throw new BadRequestException(
        `Lấy danh sách địa chỉ thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      );
    }
  }

  async findOne(id: number, userId: number): Promise<Address> {
    try {
      const address = await this.addressRepository.findByIdAndUserId(id, userId);
      if (!address) {
        throw new NotFoundException(`Không tìm thấy địa chỉ với ID ${id}`);
      }
      return address;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Không tìm thấy địa chỉ với ID ${id}`);
    }
  }

  async findByUserId(userId: number): Promise<Address[]> {
    try {
      return await this.addressRepository.findByUserId(userId);
    } catch (error) {
      throw new BadRequestException(
        `Lấy danh sách địa chỉ của người dùng ${userId} thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      );
    }
  }

  async update(id: number, updateAddressDto: UpdateAddressDto, userId: number): Promise<Address> {
    try {
      //Kiểm tra địa chỉ có tồn tại và thuộc về user không
      await this.findOne(id, userId);

      // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
      if (updateAddressDto.is_default) {
        await this.addressRepository.removeDefaultFromUser(userId);
      }

      return await this.addressRepository.update(id, updateAddressDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Cập nhật địa chỉ thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      );
    }
  }

  async remove(id: number, userId: number): Promise<void> {
    try {
      // Kiểm tra địa chỉ có tồn tại và thuộc về user không
      await this.findOne(id, userId);
      await this.addressRepository.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Xóa địa chỉ thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      );
    }
  }

  async setDefaultAddress(id: number, userId: number): Promise<Address> {
    try {
      // Kiểm tra địa chỉ có tồn tại và thuộc về người dùng không
      await this.findOne(id, userId);

      return await this.addressRepository.setDefaultAddress(id, userId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Đặt địa chỉ mặc định thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      );
    }
  }

  async findDefaultByUserId(userId: number): Promise<Address | null> {
    try {
      return await this.addressRepository.findDefaultByUserId(userId);
    } catch (error) {
      throw new BadRequestException(
        `Lấy địa chỉ mặc định thất bại: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
      );
    }
  }
}
