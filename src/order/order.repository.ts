import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../database/abstract.repository';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { FilterOrderDto } from './dto/filter-order.dto';
import { NotFoundException } from '@nestjs/common';
import { PaymentStatus } from './enums/payment-status.enum';
import { UpdateOrderDto } from './dto/update-order.dto';

export class OrderRepository extends BaseRepository<Order> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {
    super(orderRepository);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['users', 'voucher', 'orderItem'],
    });
  }

  async filterAllOrder(query: FilterOrderDto) {
    const { search, status, page = 1, limit = 10 } = query;

    const qb = this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.user', 'u')
      .select([
        'o.id AS id',
        'o.order_code AS orderCode',
        'o.status AS status',
        'o.total_price AS totalPrice',
        'u.name AS userName',
        'u.phone AS userPhone',
      ]);

    if (search) {
      qb.andWhere(
        `(LOWER(o.order_code) LIKE LOWER(:search)
          OR LOWER(u.name) LIKE LOWER(:search)
          OR LOWER(u.phone) LIKE LOWER(:search))`,
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere(`LOWER(o.status) LIKE LOWER(:status)`, {
        status: `%${status}%`,
      });
    }

    qb.orderBy('o.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await Promise.all([
      qb.getRawMany(),
      qb
        .clone()
        .select('COUNT(o.id)', 'count')
        .getRawOne()
        .then((r) => Number(r.count)),
    ]);

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

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['users', 'voucher', 'orderItem'],
    });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return order;
  }

  async updatePayment(id: number, updateData: Partial<Order>): Promise<Order> {
    const order = await this.orderRepository.preload({ id: Number(id), ...updateData });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return this.orderRepository.save(order);
  }

  async findOnePayment(id: number): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return order;
  }

  async countNumberOfOrder(): Promise<number> {
    return await this.orderRepository.count({
      where: { status: PaymentStatus.SUCCESS },
    });
  }

  async updateOrder(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.preload({ id: Number(id), ...updateOrderDto });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return this.orderRepository.save(order);
  }

  async findByOrderCode(orderCode: string): Promise<Order | null> {
    return await this.orderRepository.findOneBy({ order_code: orderCode });
  }

  async getTotalRevenueSuccess(): Promise<number> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total_price)', 'total')
      .where('order.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne<{ total: string | null }>();

    // Nếu không có kết quả thì trả về 0
    return result?.total ? Number(result.total) : 0;
  }

  async getMonthlyRevenueSuccess(year: number): Promise<number[]> {
    const rows = await this.orderRepository
      .createQueryBuilder('o')
      .select('MONTH(o.createdAt)', 'month')
      .addSelect('SUM(o.total_price)', 'total')
      .where('o.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('YEAR(o.createdAt) = :year', { year })
      .groupBy('MONTH(o.createdAt)')
      .orderBy('MONTH(o.createdAt)', 'ASC')
      .getRawMany<{ month: number; total: string }>();

    const monthly = Array(12).fill(0);
    for (const r of rows) {
      monthly[Number(r.month) - 1] = Number(r.total);
    }
    return monthly;
  }
}
