import { BaseRepository } from '../database/abstract.repository';
import { Voucher } from './entities/voucher.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterVoucherDto } from './dto/filter-voucher.dto';

export class VoucherRepository extends BaseRepository<Voucher> {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
  ) {
    super(voucherRepository);
  }
  async findAll() {
    return await this.voucherRepository.find();
  }

  async filterAllVoucher(query: FilterVoucherDto) {
    const { search, start_date, end_date, is_used, page = 1, limit = 10 } = query;

    const qb = this.voucherRepository.createQueryBuilder('voucher');

    if (search) {
      qb.andWhere(`LOWER(voucher.code) LIKE LOWER(:search)`, { search: `%${search}%` });
    }

    if (start_date) {
      qb.andWhere(`voucher.start_date >= :start_date`, { start_date });
    }

    if (end_date) {
      qb.andWhere(`voucher.end_date <= :end_date`, { end_date });
    }

    if (is_used !== undefined) {
      qb.andWhere(`voucher.is_used = :is_used`, { is_used });
    }

    qb.orderBy('voucher.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
