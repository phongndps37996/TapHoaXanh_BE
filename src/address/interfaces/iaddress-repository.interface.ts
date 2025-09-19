import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { Address } from '../entities/address.entity';

export abstract class IAddressRepository {
  abstract create(createAddressDto: CreateAddressDto, userId: number): Promise<Address>;
  abstract findAll(): Promise<Address[]>;
  abstract findOne(id: number): Promise<Address>;
  abstract findByUserId(userId: number): Promise<Address[]>;
  abstract update(id: number, updateAddressDto: UpdateAddressDto): Promise<Address>;
  abstract remove(id: number): Promise<void>;
  abstract setDefaultAddress(id: number, userId: number): Promise<Address>;
  abstract removeDefaultFromUser(userId: number): Promise<void>;
  abstract findDefaultByUserId(userId: number): Promise<Address | null>;
  abstract findByIdAndUserId(id: number, userId: number): Promise<Address | null>;
}
