import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAddressRepository } from '../interfaces/iaddress-repository.interface';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { Address } from '../entities/address.entity';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(createAddressDto: CreateAddressDto, userId: number): Promise<Address> {
    const address = this.addressRepository.create({
      ...createAddressDto,
      users: { id: userId } as any,
    });
    return await this.addressRepository.save(address);
  }

  async findAll(): Promise<Address[]> {
    return await this.addressRepository.find({
      select: ['id', 'street', 'city', 'district', 'is_default', 'createdAt', 'updatedAt'],
    });
  }

  async findOne(id: number): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      select: ['id', 'street', 'city', 'district', 'is_default', 'createdAt', 'updatedAt'],
    });
    if (!address) {
      throw new Error(`Địa chỉ ${id} không tồn tại`);
    }
    return address;
  }

  async findByUserId(userId: number): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { users: { id: userId } },
      select: ['id', 'street', 'city', 'district', 'is_default', 'createdAt', 'updatedAt'],
      order: {
        is_default: 'DESC', // Địa chỉ mặc định lên đầu
        createdAt: 'DESC', // Mới nhất lên đầu
      },
    });
  }

  async update(id: number, updateAddressDto: UpdateAddressDto): Promise<Address> {
    await this.addressRepository.update(id, updateAddressDto);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.addressRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`Địa chỉ ${id} không tồn tại`);
    }
  }

  async setDefaultAddress(id: number, userId: number): Promise<Address> {
    // Bỏ mặc định của tất cả địa chỉ của người dùng
    await this.removeDefaultFromUser(userId);

    // Đặt địa chỉ được chỉ định làm mặc định
    await this.addressRepository.update(id, { is_default: true });
    return await this.findOne(id);
  }

  async removeDefaultFromUser(userId: number): Promise<void> {
    await this.addressRepository.update({ users: { id: userId } }, { is_default: false });
  }

  async findDefaultByUserId(userId: number): Promise<Address | null> {
    return await this.addressRepository.findOne({
      where: {
        users: { id: userId },
        is_default: true,
      },
      select: ['id', 'street', 'city', 'district', 'is_default', 'createdAt', 'updatedAt'],
    });
  }

  async findByIdAndUserId(id: number, userId: number): Promise<Address | null> {
    return await this.addressRepository.findOne({
      where: {
        id,
        users: { id: userId },
      },
      select: ['id', 'street', 'city', 'district', 'is_default', 'createdAt', 'updatedAt'],
    });
  }
}
