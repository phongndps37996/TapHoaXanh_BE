import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { forwardRef, Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { OrderModule } from '../order/order.module';
import { HashAlgorithm, VNPay } from 'vnpay';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), forwardRef(() => OrderModule)],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentRepository,
    {
      provide: VNPay,
      useFactory: () => {
        return new VNPay({
          tmnCode: process.env.VNP_TMN_CODE as string,
          secureSecret: process.env.VNP_HASH_SECRET as string,
          vnpayHost: 'https://sandbox.vnpayment.vn',
          testMode: true,
          hashAlgorithm: HashAlgorithm.SHA512,
        });
      },
    },
  ],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
