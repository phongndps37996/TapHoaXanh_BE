import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from '../order/order.repository';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherRepository } from './voucher.repository';
import { FilterVoucherDto } from './dto/filter-voucher.dto';

@Injectable()
export class VoucherService {
  constructor(
    private readonly voucherRepository: VoucherRepository,
    private readonly orderRepository: OrderRepository,
  ) {}
  async create(createVoucherDto: CreateVoucherDto) {
    const voucher = await this.voucherRepository.create({ ...createVoucherDto });
    if (createVoucherDto.orderId) {
      const orderExist = await this.orderRepository.findById(createVoucherDto.orderId);
      if (!orderExist) throw new NotFoundException('Đơn hàng không tồn tại');
      voucher.order = orderExist;
    }
    return await this.voucherRepository.save(voucher);
  }

  findAll() {
    return this.voucherRepository.findAll();
  }

  async filterAllVoucher(query: FilterVoucherDto) {
    return await this.voucherRepository.filterAllVoucher(query);
  }

  async findOne(id: number) {
    return await this.voucherRepository.findById(id);
  }

  async update(id: number, updateVoucherDto: UpdateVoucherDto) {
    const voucher = await this.findOne(id);
    if (!voucher) throw new NotFoundException('Voucher không tồn tại');
    if (updateVoucherDto.code) {
      const idProduct = await this.voucherRepository.findOneByField('code', updateVoucherDto.code);
      if (idProduct && idProduct.id !== id) throw new BadRequestException('Mã code này đã được sử dụng');
    }
    const updateVoucher = this.voucherRepository.create({ ...voucher, ...updateVoucherDto });
    await this.voucherRepository.save(updateVoucher);

    return {
      message: 'Cập nhật thành công',
      data_update: updateVoucher,
    };
  }

  remove(id: number) {
    const voucher = this.findOne(id);
    if (!voucher) throw new NotFoundException('Voucher không tồn tại');
    return this.voucherRepository.delete(id);
  }
}
