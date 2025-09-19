import { Provider } from '@nestjs/common';
import { IAddressService } from './interfaces/iaddress-service.interface';
import { AddressService } from './implements/address.service';
import { AddressRepository } from './implements/address.repository';
import { IAddressRepository } from './interfaces/iaddress-repository.interface';

export const AddressServiceProvider: Provider = {
  provide: IAddressService,
  useClass: AddressService,
};

export const AddressRepositoryProvider: Provider = {
  provide: IAddressRepository,
  useClass: AddressRepository,
};
