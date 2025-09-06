import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { FilterVoucherDto } from './dto/filter-voucher.dto';
import { IsAdminGuard } from 'src/auth/guards/IsAdmin.guard';
import { JwtGuard } from 'src/auth/guards/jwt.guard';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post()
  @UseGuards(JwtGuard, IsAdminGuard)
  create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.voucherService.create(createVoucherDto);
  }

  @Get()
  findAll() {
    return this.voucherService.findAll();
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Get('/search')
  filterAllVoucher(@Query() query: FilterVoucherDto) {
    return this.voucherService.filterAllVoucher(query);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.voucherService.findOne(id);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVoucherDto: UpdateVoucherDto) {
    return this.voucherService.update(+id, updateVoucherDto);
  }

  @UseGuards(JwtGuard, IsAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.voucherService.remove(+id);
  }
}
