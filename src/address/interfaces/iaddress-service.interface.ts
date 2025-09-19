import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { Address } from '../entities/address.entity';

export abstract class IAddressService {
  abstract create(createAddressDto: CreateAddressDto, userId: number): Promise<Address>;
  abstract findAll(): Promise<Address[]>;
  abstract findOne(id: number, userId: number): Promise<Address>;
  abstract findByUserId(userId: number): Promise<Address[]>;
  abstract update(id: number, updateAddressDto: UpdateAddressDto, userId: number): Promise<Address>;
  abstract remove(id: number, userId: number): Promise<void>;
  abstract setDefaultAddress(id: number, userId: number): Promise<Address>;
  abstract findDefaultByUserId(userId: number): Promise<Address | null>;
}
