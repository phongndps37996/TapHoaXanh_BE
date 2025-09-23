import { BaseRepository } from '../database/abstract.repository';
import { Payment } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentRepository extends BaseRepository<Payment> {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {
    super(paymentRepository);
  }

  async findOneByTxnRefWithOrder(txnRef: string) {
    return this.paymentRepository.findOne({
      where: { txn_ref: txnRef },
      relations: ['order'],
    });
  }

  async findByOrderId(orderId: number) {
    return this.paymentRepository.findOne({
      where: { order: { id: orderId } },
      relations: ['order'],
    });
  }
}
