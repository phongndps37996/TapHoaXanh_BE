import { Module } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { Voucher } from './entities/voucher.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from '../order/order.module';
import { VoucherRepository } from './voucher.repository';
import { IsAdminGuard } from 'src/auth/guards/IsAdmin.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher]), OrderModule, AuthModule],
  controllers: [VoucherController],
  providers: [VoucherService, VoucherRepository, IsAdminGuard],
  exports: [VoucherService, VoucherRepository],
})
export class VoucherModule {}
