import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseRepository } from '../database/abstract.repository';
import { FilterOrderDto } from './dto/filter-order.dto';
import { PaginatedOrdersDto } from './dto/paginated-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { Address } from '../address/entities/address.entity';

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
      .addSelect(
        `
        CASE 
          WHEN order.status = 'pending' AND payments.payment_method = 'vnpay' AND (payments.status = 'failed' OR payments.status = 'pending') THEN 1
          WHEN order.status = 'cancelled' THEN 2
          WHEN order.status = 'success' THEN 3
          WHEN order.status = 'delivered' THEN 4
          WHEN order.status = 'confirmed' THEN 5
          WHEN order.status = 'pending' THEN 6
          ELSE 7
        END
      `,
        'status_priority',
      )
      .where('order.user.id = :userId', { userId })
      .orderBy('status_priority', 'ASC')
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
    const {
      search,
      status,
      page = 1,
      limit = 10,
      start_date,
      end_date,
      month,
      year,
      payment_status,
      payment_method,
    } = query;

    const qb = this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.user', 'u')
      .leftJoin('o.payments', 'p')
      .select(['o.id', 'o.order_code', 'o.status', 'o.total_price', 'o.createdAt', 'o.updatedAt'])
      .addSelect(['u.name', 'u.phone', 'p.payment_method', 'p.status'])
      .groupBy('o.id, u.id, p.id');

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

    if (payment_status) {
      qb.andWhere(`LOWER(p.status) LIKE LOWER(:payment_status)`, {
        payment_status: `%${payment_status}%`,
      });
    }

    if (payment_method) {
      qb.andWhere(`LOWER(p.payment_method) LIKE LOWER(:payment_method)`, {
        payment_method: `%${payment_method}%`,
      });
    }

    qb.orderBy('o.id', 'DESC')
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

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'user.address', 'address', 'voucher', 'orderItem', 'orderItem.product', 'payments'],
    });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);
    return order;
  }

  // Lấy địa chỉ đã chọn trong đơn hàng
  async getOrderAddress(orderId: number): Promise<any> {
    const result = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .leftJoin('user.address', 'address')
      .select([
        'order.id as orderId',
        'order.order_code as orderCode',
        'address.id as addressId',
        'address.street as street',
        'address.city as city',
        'address.district as district',
        'address.is_default as isDefault',
        'user.name as userName',
        'user.phone as userPhone',
      ])
      .where('order.id = :orderId', { orderId })
      .getRawOne();

    return result;
  }

  async findWithItemsAndProducts(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderItem', 'orderItem.product', 'user', 'voucher', 'payments'],
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
      .innerJoin('o.payments', 'p')
      .where('p.status = :status', { status: 'success' });

    if (month) {
      qb.andWhere(`EXTRACT(MONTH FROM o.createdAt) = :month`, { month });
    }

    if (year) {
      qb.andWhere(`EXTRACT(YEAR FROM o.createdAt) = :year`, { year });
    }

    return await qb.getCount();
  }

  async updateOrder(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const { addressId, ...otherFields } = updateOrderDto;

    const order = await this.orderRepository.preload({ id: Number(id), ...otherFields });
    if (!order) throw new NotFoundException(`Order with id ${id} not found`);

    // Cập nhật address nếu có
    if (addressId !== undefined) {
      if (addressId === null) {
        // Xóa address
        order.address = undefined;
      } else {
        // Cập nhật address mới
        const address = await this.orderRepository.manager.getRepository(Address).findOne({
          where: { id: addressId },
        });
        if (!address) {
          throw new NotFoundException(`Address with id ${addressId} not found`);
        }
        order.address = address;
      }
    }

    const savedOrder = await this.orderRepository.save(order);

    // Load address relation khi trả về
    const updatedOrder = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['user', 'user.address', 'address', 'voucher', 'orderItem', 'orderItem.product', 'payments'],
    });

    if (!updatedOrder) {
      throw new NotFoundException(`Order with id ${id} not found after update`);
    }

    return updatedOrder;
  }

  async findByOrderCode(orderCode: string): Promise<Order | null> {
    return await this.orderRepository.findOneBy({ order_code: orderCode });
  }

  async getTotalRevenueSuccess(year?: number, month?: number): Promise<number> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.payments', 'p')
      .select('SUM(o.total_price)', 'total')
      .where('p.status = :status', { status: 'success' });

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
      .innerJoin('o.payments', 'p')
      .select('MONTH(o.createdAt)', 'month')
      .addSelect('SUM(o.total_price)', 'total')
      .where('p.status = :status', { status: 'success' })
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

  async getDailyRevenue(start_date?: string, end_date?: string): Promise<{ date: string; revenue: number }[]> {
    const qb = this.orderRepository
      .createQueryBuilder('o')
      .innerJoin('o.payments', 'p')
      .select('DATE(o.createdAt)', 'date')
      .addSelect('SUM(o.total_price)', 'revenue')
      .where('p.status = :status', { status: 'success' });

    if (start_date) {
      qb.andWhere('DATE(o.createdAt) >= :start_date', { start_date });
    }

    if (end_date) {
      qb.andWhere('DATE(o.createdAt) <= :end_date', { end_date });
    }

    const rows = await qb
      .groupBy('DATE(o.createdAt)')
      .orderBy('DATE(o.createdAt)', 'ASC')
      .getRawMany<{ date: string; revenue: string }>();

    return rows.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue),
    }));
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
