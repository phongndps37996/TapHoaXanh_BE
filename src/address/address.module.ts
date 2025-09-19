import { Module } from '@nestjs/common';
import { AddressService } from './implements/address.service';
import { AddressController } from './address.controller';
import { AddressRepository } from './implements/address.repository';
import { Address } from './entities/address.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressServiceProvider, AddressRepositoryProvider } from './address.provider';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Address]), AuthModule],
  controllers: [AddressController],
  providers: [AddressServiceProvider, AddressRepositoryProvider, AddressService, AddressRepository],
  exports: [AddressService, AddressRepository],
})
export class AddressModule {}
