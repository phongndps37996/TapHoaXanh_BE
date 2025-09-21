import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from '../database/abstract.repository';
import { FilterOrderDto } from './dto/filter-order.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { PaymentStatus } from './enums/payment-status.enum';

export class OrderRepository extends BaseRepository<Order> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {
    super(orderRepository);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['voucher', 'orderItem'],
    });
  }
  async findAllOwned(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['voucher', 'orderItem', 'orderItem.product', 'payments'],
      select: ['id', 'order_code', 'status', 'total_price', 'createdAt'],
    });
  }

  async findOwnedOrdersPaginated(userId: number, query: PaginatedOrdersDto) {
    const { page = 1, limit = 10 } = query;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.voucher', 'voucher')
      .leftJoinAndSelect('order.orderItem', 'orderItem')
      .leftJoinAndSelect('orderItem.product', 'product')
      .leftJoinAndSelect('order.payments', 'payments')
      .addSelect("CASE WHEN order.status = 'pending' THEN 0 ELSE 1 END", 'priority')
      .where('order.user.id = :userId', { userId })
      .orderBy('priority', 'ASC')
      .addOrderBy('order.createdAt', 'DESC')
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

  async filterAllOrder(query: FilterOrderDto) {
    const { search, status, page = 1, limit = 10, start_date, end_date, month, year } = query;

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

    if (start_date) {
      qb.andWhere(`o.createdAt >= :start_date`, { start_date });
    }

    if (end_date) {
      qb.andWhere(`o.createdAt <= :end_date`, { end_date });
    }

    if (month) {
      qb.andWhere(`EXTRACT(MONTH FROM o.createdAt) = :month`, { month });
    }

    if (year) {
      qb.andWhere(`EXTRACT(YEAR FROM o.createdAt) = :year`, { year });
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
      relations: ['user', 'voucher', 'orderItem', 'orderItem.product', 'payments'],
    });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return order;
  }

  async findWithItemsAndProducts(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItem', 'orderItem.product', 'user', 'voucher'],
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

  async countNumberOfOrder(year?: number, month?: number): Promise<number> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.status = :status', { status: PaymentStatus.SUCCESS });

    if (month) {
      qb.andWhere(`EXTRACT(MONTH FROM o.createdAt) = :month`, { month });
    }

    if (year) {
      qb.andWhere(`EXTRACT(YEAR FROM o.createdAt) = :year`, { year });
    }

    return await qb.getCount();
  }

  async updateOrder(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderRepository.preload({ id: Number(id), ...updateOrderDto });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return this.orderRepository.save(order);
  }

  async findByOrderCode(orderCode: string): Promise<Order | null> {
    return await this.orderRepository.findOneBy({ order_code: orderCode });
  }

  async getTotalRevenueSuccess(year?: number, month?: number): Promise<number> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.total_price)', 'total')
      .where('o.status = :status', { status: PaymentStatus.SUCCESS });

    if (month) {
      qb.andWhere(`EXTRACT(MONTH FROM o.createdAt) = :month`, { month });
    }

    if (year) {
      qb.andWhere(`EXTRACT(YEAR FROM o.createdAt) = :year`, { year });
    }

    const result = await qb.getRawOne<{ total: string | null }>();

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

  async getOrderDetailByCode(orderCode: string): Promise<Order[]> {
    return await this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.user', 'u')
      .innerJoin('o.orderItem', 'oi')
      .innerJoin('oi.product', 'p')
      .select([
        'p.name AS productName',
        'oi.unit_price AS unitPrice',
        'oi.quantity AS quantity',
        'o.order_code AS orderCode',
        'u.name AS userName',
        'p.images AS productImage',
      ])
      .where('o.order_code = :orderCode', { orderCode })
      .getRawMany();
  }
  async resetAutoIncrement(): Promise<void> {
    await this.dataSource.query('ALTER TABLE order AUTO_INCREMENT = 1');
  }
}
